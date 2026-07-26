<?php

namespace App\Services;

use App\Models\RecruiterAdminAction;
use App\Models\RecruiterProfile;
use App\Models\User;
use App\Support\Roles;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AdminRecruiterService
{
    public function __construct(
        private RecruiterOnboardingService $onboarding,
        private NotificationService $notifications,
    ) {
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listRecruiters(array $filters = []): LengthAwarePaginator
    {
        $query = RecruiterProfile::query()
            ->with(['user:id,name,email,mobile,verified_email,verified_mobile,created_at,role'])
            ->whereHas('user', fn ($q) => $q->where('role', Roles::RECRUITER));

        $status = $filters['status'] ?? null;
        if (is_string($status) && $status !== '' && $status !== 'all') {
            $query->where('approval_status', $status);
        }

        $type = $filters['type'] ?? null;
        if ($type === 'company') {
            $query->whereIn('recruiter_type', ['company_recruiter', 'startup', 'consultancy']);
        } elseif ($type === 'individual') {
            $query->where('recruiter_type', 'individual_recruiter');
        } elseif (is_string($type) && $type !== '' && $type !== 'all') {
            $query->where('recruiter_type', $type);
        }

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('recruiter_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('industry', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('mobile', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $sort = ($filters['sort'] ?? 'newest') === 'oldest' ? 'asc' : 'desc';
        $query->orderBy('created_at', $sort);

        $perPage = min(max((int) ($filters['per_page'] ?? 12), 1), 50);

        return $query->paginate($perPage)->through(fn (RecruiterProfile $profile) => $this->listItem($profile));
    }

    public function detail(int $userId): array
    {
        $user = User::where('id', $userId)->where('role', Roles::RECRUITER)->firstOrFail();
        $profile = $this->onboarding->ensureProfile($user);
        $profile->load(['adminActions.admin:id,name,email', 'reviewer:id,name,email']);

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'verified_email' => $this->onboarding->isEmailVerified($user),
                'verified_mobile' => $this->onboarding->isMobileVerified($user),
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'profile' => $this->onboarding->transformProfile($profile),
            'onboarding' => $this->onboarding->statusPayload($user),
            'rejection_reason' => $profile->rejection_reason,
            'required_changes' => $profile->required_changes,
            'internal_notes' => $profile->internal_notes,
            'reviewed_by' => $profile->reviewer ? [
                'id' => $profile->reviewer->id,
                'name' => $profile->reviewer->name,
                'email' => $profile->reviewer->email,
            ] : null,
            'suspended_at' => $profile->suspended_at?->toIso8601String(),
            'history' => $profile->adminActions->map(fn (RecruiterAdminAction $action) => $this->transformAction($action))->values()->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function review(User $admin, int $userId, array $payload): array
    {
        $user = User::where('id', $userId)->where('role', Roles::RECRUITER)->firstOrFail();
        $profile = $this->onboarding->ensureProfile($user);
        $fromStatus = $profile->approval_status;

        $action = (string) ($payload['action'] ?? '');
        if ($action === '') {
            $action = $this->inferAction((string) ($payload['approval_status'] ?? ''));
        }

        return DB::transaction(function () use ($admin, $user, $profile, $payload, $action, $fromStatus) {
            if ($action === RecruiterAdminAction::ACTION_INTERNAL_NOTE) {
                $notes = trim((string) ($payload['internal_notes'] ?? $payload['admin_remarks'] ?? $payload['notes'] ?? ''));
                if ($notes === '') {
                    throw new InvalidArgumentException('Internal notes are required.');
                }

                $existing = trim((string) $profile->internal_notes);
                $profile->internal_notes = $existing === '' ? $notes : ($existing . "\n\n" . $notes);
                $profile->save();

                $this->logAction($profile, $admin, $action, $fromStatus, $fromStatus, null, $notes, null, true);

                return $this->detail($user->id);
            }

            [$toStatus, $onboardingStep] = match ($action) {
                RecruiterAdminAction::ACTION_APPROVE,
                RecruiterAdminAction::ACTION_REACTIVATE => [RecruiterProfile::APPROVAL_APPROVED, 'complete'],
                RecruiterAdminAction::ACTION_REJECT => [RecruiterProfile::APPROVAL_REJECTED, 'rejected'],
                RecruiterAdminAction::ACTION_REQUEST_CHANGES => [RecruiterProfile::APPROVAL_CHANGES_REQUESTED, 'changes_requested'],
                RecruiterAdminAction::ACTION_SUSPEND => [RecruiterProfile::APPROVAL_SUSPENDED, 'suspended'],
                default => throw new InvalidArgumentException('Unsupported admin action.'),
            };

            $reason = trim((string) ($payload['rejection_reason'] ?? $payload['reason'] ?? ''));
            $notes = trim((string) ($payload['admin_remarks'] ?? $payload['notes'] ?? ''));
            $requiredChanges = trim((string) ($payload['required_changes'] ?? ''));

            if (in_array($action, [RecruiterAdminAction::ACTION_REJECT, RecruiterAdminAction::ACTION_REQUEST_CHANGES], true) && $reason === '' && $notes === '') {
                throw new InvalidArgumentException('A reason or notes are required for this action.');
            }

            $profile->approval_status = $toStatus;
            $profile->admin_remarks = $notes !== '' ? $notes : $profile->admin_remarks;
            $profile->rejection_reason = in_array($action, [RecruiterAdminAction::ACTION_REJECT, RecruiterAdminAction::ACTION_REQUEST_CHANGES], true)
                ? ($reason !== '' ? $reason : $notes)
                : null;
            $profile->required_changes = $action === RecruiterAdminAction::ACTION_REQUEST_CHANGES
                ? ($requiredChanges !== '' ? $requiredChanges : null)
                : ($action === RecruiterAdminAction::ACTION_APPROVE || $action === RecruiterAdminAction::ACTION_REACTIVATE ? null : $profile->required_changes);
            $profile->reviewed_at = now();
            $profile->reviewed_by = $admin->id;
            $profile->onboarding_step = $onboardingStep;
            $profile->suspended_at = $action === RecruiterAdminAction::ACTION_SUSPEND ? now() : null;

            if ($action === RecruiterAdminAction::ACTION_APPROVE || $action === RecruiterAdminAction::ACTION_REACTIVATE) {
                $profile->rejection_reason = null;
                $profile->required_changes = null;
            }

            $profile->save();

            $this->logAction($profile, $admin, $action, $fromStatus, $toStatus, $reason !== '' ? $reason : null, $notes !== '' ? $notes : null, $requiredChanges !== '' ? $requiredChanges : null);
            $this->notifyRecruiter($user, $action, $profile);

            return $this->detail($user->id);
        });
    }

    public function dashboardStats(): array
    {
        $base = RecruiterProfile::query()->whereHas('user', fn ($q) => $q->where('role', Roles::RECRUITER));

        $pending = (clone $base)->where('approval_status', RecruiterProfile::APPROVAL_PENDING)->count();
        $approved = (clone $base)->where('approval_status', RecruiterProfile::APPROVAL_APPROVED)->count();
        $rejected = (clone $base)->where('approval_status', RecruiterProfile::APPROVAL_REJECTED)->count();
        $changes = (clone $base)->where('approval_status', RecruiterProfile::APPROVAL_CHANGES_REQUESTED)->count();
        $suspended = (clone $base)->where('approval_status', RecruiterProfile::APPROVAL_SUSPENDED)->count();

        $todayRegistrations = User::where('role', Roles::RECRUITER)->whereDate('created_at', Carbon::today())->count();
        $monthlyRegistrations = User::where('role', Roles::RECRUITER)->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->count();

        $byType = (clone $base)
            ->select('recruiter_type', DB::raw('count(*) as total'))
            ->whereNotNull('recruiter_type')
            ->groupBy('recruiter_type')
            ->pluck('total', 'recruiter_type')
            ->all();

        $topIndustries = (clone $base)
            ->select('industry', DB::raw('count(*) as total'))
            ->whereNotNull('industry')
            ->where('industry', '!=', '')
            ->groupBy('industry')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($row) => ['industry' => $row->industry, 'total' => (int) $row->total])
            ->all();

        $verificationPending = User::where('role', Roles::RECRUITER)
            ->where(function ($q) {
                $q->where('verified_email', false)->orWhereNull('verified_email')
                    ->orWhere('verified_mobile', false)->orWhereNull('verified_mobile');
            })
            ->count();

        $recentActivity = RecruiterAdminAction::query()
            ->with(['admin:id,name', 'profile:id,company_name,recruiter_name,user_id'])
            ->latest()
            ->limit(12)
            ->get()
            ->map(fn (RecruiterAdminAction $action) => $this->transformAction($action))
            ->all();

        return [
            'pending_recruiters' => $pending,
            'approved_recruiters' => $approved,
            'rejected_recruiters' => $rejected,
            'changes_requested' => $changes,
            'suspended_recruiters' => $suspended,
            'todays_registrations' => $todayRegistrations,
            'monthly_registrations' => $monthlyRegistrations,
            'pending_reviews' => $pending + $changes,
            'recruiters_by_type' => $byType,
            'top_industries' => $topIndustries,
            'verification_pending' => $verificationPending,
            'recent_activity' => $recentActivity,
            'totals' => [
                'recruiters' => (clone $base)->count(),
                'mentors' => User::where('role', Roles::MENTOR)->count(),
                'seekers' => User::where('role', Roles::SEEKER)->count(),
            ],
        ];
    }

    private function listItem(RecruiterProfile $profile): array
    {
        $user = $profile->user;

        return [
            'user_id' => $profile->user_id,
            'company_logo' => $profile->logoUrl(),
            'company_name' => $profile->company_name,
            'recruiter_name' => $profile->recruiter_name ?: $user?->name,
            'email' => $profile->email ?: $user?->email,
            'phone' => $profile->phone ?: $user?->mobile,
            'recruiter_type' => $profile->recruiter_type,
            'industry' => $profile->industry,
            'company_size' => $profile->company_size,
            'location' => $profile->locationLabel(),
            'registration_date' => ($user?->created_at ?? $profile->created_at)?->toIso8601String(),
            'profile_completion' => $profile->profile_completion ?? 0,
            'approval_status' => $profile->approval_status,
            'submitted_at' => $profile->submitted_at?->toIso8601String(),
            'verified_email' => (bool) ($user?->verified_email || $user?->email_verified_at),
            'verified_mobile' => (bool) ($user?->verified_mobile || $user?->mobile_verified_at),
        ];
    }

    private function transformAction(RecruiterAdminAction $action): array
    {
        return [
            'id' => $action->id,
            'action' => $action->action,
            'from_status' => $action->from_status,
            'to_status' => $action->to_status,
            'reason' => $action->reason,
            'notes' => $action->notes,
            'required_changes' => $action->required_changes,
            'is_internal_note' => (bool) $action->is_internal_note,
            'admin' => $action->relationLoaded('admin') && $action->admin ? [
                'id' => $action->admin->id,
                'name' => $action->admin->name,
                'email' => $action->admin->email ?? null,
            ] : null,
            'company_name' => $action->relationLoaded('profile') ? $action->profile?->company_name : null,
            'recruiter_name' => $action->relationLoaded('profile') ? $action->profile?->recruiter_name : null,
            'user_id' => $action->relationLoaded('profile') ? $action->profile?->user_id : null,
            'created_at' => $action->created_at?->toIso8601String(),
        ];
    }

    private function logAction(
        RecruiterProfile $profile,
        User $admin,
        string $action,
        ?string $fromStatus,
        ?string $toStatus,
        ?string $reason,
        ?string $notes,
        ?string $requiredChanges,
        bool $internal = false,
    ): void {
        RecruiterAdminAction::create([
            'recruiter_profile_id' => $profile->id,
            'admin_id' => $admin->id,
            'action' => $action,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'reason' => $reason,
            'notes' => $notes,
            'required_changes' => $requiredChanges,
            'is_internal_note' => $internal,
        ]);
    }

    private function notifyRecruiter(User $user, string $action, RecruiterProfile $profile): void
    {
        [$title, $message] = match ($action) {
            RecruiterAdminAction::ACTION_APPROVE => [
                'Recruiter account approved',
                'Your recruiter profile has been approved. You can now access the recruiter dashboard.',
            ],
            RecruiterAdminAction::ACTION_REJECT => [
                'Recruiter account rejected',
                'Your recruiter profile was rejected. Review the reason, update your profile, and resubmit.',
            ],
            RecruiterAdminAction::ACTION_REQUEST_CHANGES => [
                'Changes requested on your recruiter profile',
                'An admin requested changes before approval. Update your profile and resubmit for review.',
            ],
            RecruiterAdminAction::ACTION_SUSPEND => [
                'Recruiter account suspended',
                'Your recruiter account has been suspended. Contact support if you believe this is a mistake.',
            ],
            RecruiterAdminAction::ACTION_REACTIVATE => [
                'Recruiter account reactivated',
                'Your recruiter account has been reactivated. You can access the recruiter dashboard again.',
            ],
            default => [null, null],
        };

        if (! $title || ! $message) {
            return;
        }

        $this->notifications->notify($user, $title, $message, 'recruiter', [
            'action' => $action,
            'approval_status' => $profile->approval_status,
            'rejection_reason' => $profile->rejection_reason,
            'required_changes' => $profile->required_changes,
            'admin_remarks' => $profile->admin_remarks,
        ]);
    }

    private function inferAction(string $status): string
    {
        return match ($status) {
            RecruiterProfile::APPROVAL_APPROVED => RecruiterAdminAction::ACTION_APPROVE,
            RecruiterProfile::APPROVAL_REJECTED => RecruiterAdminAction::ACTION_REJECT,
            RecruiterProfile::APPROVAL_CHANGES_REQUESTED => RecruiterAdminAction::ACTION_REQUEST_CHANGES,
            RecruiterProfile::APPROVAL_SUSPENDED => RecruiterAdminAction::ACTION_SUSPEND,
            default => throw new InvalidArgumentException('approval_status or action is required.'),
        };
    }
}
