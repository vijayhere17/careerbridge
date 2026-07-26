<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\MentorProfile;
use App\Models\User;
use App\Services\NotificationService;
use App\Support\Roles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminMentorController extends AdminBaseController
{
    public function __construct(private NotificationService $notifications)
    {
    }

    public function index(Request $request)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', ''));

        $query = User::query()
            ->where('role', Roles::MENTOR)
            ->with('mentorProfile')
            ->latest();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        if ($status !== '' && $status !== 'all') {
            $query->whereHas('mentorProfile', function ($q) use ($status) {
                $q->where('onboarding_status', $status);
            });
        }

        $paginator = $query->paginate(min(max((int) $request->query('per_page', 12), 1), 50));

        return $this->success([
            'items' => collect($paginator->items())->map(function (User $user) {
                $profile = $user->mentorProfile;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'mobile' => $user->mobile,
                    'created_at' => $user->created_at?->toIso8601String(),
                    'verified_email' => (bool) ($user->verified_email || $user->email_verified_at),
                    'onboarding_status' => $profile?->onboarding_status ?? 'profile_setup',
                    'verified' => (bool) ($profile?->verified ?? false),
                    'available' => (bool) ($profile?->available ?? false),
                    'company' => $profile?->company,
                    'designation' => $profile?->designation,
                    'industry' => $profile?->industry,
                    'rating' => (float) ($profile?->rating ?? 0),
                    'session_count' => (int) ($profile?->session_count ?? 0),
                ];
            })->all(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Mentors retrieved successfully.');
    }

    public function show(Request $request, int $userId)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        $user = User::where('role', Roles::MENTOR)
            ->with([
                'mentorProfile.skills',
                'mentorProfile.languages',
                'mentorProfile.services',
                'mentorProfile.bankDetail',
            ])
            ->find($userId);

        if (! $user || ! $user->mentorProfile) {
            return $this->notFound('Mentor not found.');
        }

        return $this->success($this->detail($user), 'Mentor details retrieved successfully.');
    }

    public function review(Request $request, int $userId)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,reject,request_changes,suspend,activate',
            'notes' => 'nullable|string|max:2000',
            'admin_remarks' => 'nullable|string|max:2000',
            'required_changes' => 'nullable|string|max:5000',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = User::where('role', Roles::MENTOR)
            ->with('mentorProfile')
            ->find($userId);

        if (! $user || ! $user->mentorProfile) {
            return $this->notFound('Mentor not found.');
        }

        $profile = $user->mentorProfile;
        $action = $validator->validated()['action'];
        $notes = $validator->validated()['notes']
            ?? $validator->validated()['admin_remarks']
            ?? null;

        match ($action) {
            'approve' => $profile->forceFill([
                'onboarding_status' => 'approved',
                'verified' => true,
                'available' => true,
            ])->save(),
            'reject' => $profile->forceFill([
                'onboarding_status' => 'rejected',
                'verified' => false,
                'available' => false,
            ])->save(),
            'request_changes' => $profile->forceFill([
                'onboarding_status' => 'profile_setup',
                'verified' => false,
                'available' => false,
            ])->save(),
            'suspend' => $profile->forceFill([
                'available' => false,
                'verified' => false,
            ])->save(),
            'activate' => $profile->forceFill([
                'onboarding_status' => 'approved',
                'verified' => true,
                'available' => true,
            ])->save(),
        };

        $titles = [
            'approve' => 'Mentor profile approved',
            'reject' => 'Mentor profile rejected',
            'request_changes' => 'Mentor profile changes requested',
            'suspend' => 'Mentor profile suspended',
            'activate' => 'Mentor profile activated',
        ];

        $messages = [
            'approve' => 'Your mentor profile has been approved. You can now access the mentor dashboard.',
            'reject' => 'Your mentor profile was rejected.' . ($notes ? ' Notes: ' . $notes : ''),
            'request_changes' => 'Please update your mentor profile and resubmit.' . ($notes ? ' Notes: ' . $notes : ''),
            'suspend' => 'Your mentor profile has been suspended.' . ($notes ? ' Notes: ' . $notes : ''),
            'activate' => 'Your mentor profile has been reactivated.',
        ];

        $this->notifications->notify(
            $user,
            $titles[$action],
            $messages[$action],
            'system',
            [
                'action' => $action,
                'onboarding_status' => $profile->fresh()->onboarding_status,
                'notes' => $notes,
                'required_changes' => $validator->validated()['required_changes'] ?? null,
                'admin_id' => $admin->id,
            ]
        );

        return $this->success(
            $this->detail($user->fresh()->load('mentorProfile.skills', 'mentorProfile.languages', 'mentorProfile.services', 'mentorProfile.bankDetail')),
            'Mentor review updated successfully.'
        );
    }

    private function detail(User $user): array
    {
        /** @var MentorProfile $profile */
        $profile = $user->mentorProfile;

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'verified_email' => (bool) ($user->verified_email || $user->email_verified_at),
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'profile' => [
                'id' => $profile->id,
                'company' => $profile->company,
                'designation' => $profile->designation,
                'industry' => $profile->industry,
                'experience' => $profile->experience,
                'location' => $profile->location,
                'bio' => $profile->bio,
                'linkedin_url' => $profile->linkedin_url,
                'portfolio_url' => $profile->portfolio_url,
                'professional_summary' => $profile->professional_summary,
                'onboarding_status' => $profile->onboarding_status,
                'verified' => (bool) $profile->verified,
                'available' => (bool) $profile->available,
                'rating' => (float) $profile->rating,
                'review_count' => (int) $profile->review_count,
                'session_count' => (int) $profile->session_count,
                'skills' => $profile->skills?->pluck('skill')->values() ?? [],
                'languages' => $profile->languages?->pluck('language')->values() ?? [],
                'services_count' => $profile->services?->count() ?? 0,
                'bank_detail' => $profile->bankDetail ? [
                    'account_holder' => $profile->bankDetail->account_holder,
                    'bank_name' => $profile->bankDetail->bank_name,
                    'account_number' => $profile->bankDetail->account_number,
                    'ifsc_code' => $profile->bankDetail->ifsc_code,
                    'upi_id' => $profile->bankDetail->upi_id,
                ] : null,
            ],
        ];
    }
}
