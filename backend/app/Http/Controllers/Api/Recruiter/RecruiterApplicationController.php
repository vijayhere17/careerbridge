<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Models\RecruiterApplication;
use App\Models\RecruiterApplicationEvent;
use App\Models\RecruiterOpportunity;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\RecruiterApplicationWorkflow;
use App\Services\RecruiterUnlockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RecruiterApplicationController extends RecruiterBaseController
{
    private const STATUSES = ['new', 'under_review', 'shortlisted', 'interview', 'interview_completed', 'accepted', 'rejected', 'withdrawn', 'hired', 'completed'];

    public function __construct(
        private RecruiterApplicationWorkflow $workflow,
        private RecruiterUnlockService $unlocks,
        private NotificationService $notifications,
    ) {
    }

    public function index(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->query(), [
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|in:' . implode(',', self::STATUSES),
            'interview_status' => 'nullable|string|max:100',
            'opportunity_type' => 'nullable|in:job,internship,freelance',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'opportunity_id' => 'nullable|integer',
            'recruiter_opportunity_id' => 'nullable|integer',
            'sort' => 'nullable|in:latest,oldest,newest,rating,status,interview',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $opportunityIds = RecruiterOpportunity::where('user_id', $user->id)->pluck('id');
        $baseQuery = RecruiterApplication::query()->whereIn('recruiter_opportunity_id', $opportunityIds);

        if ($search = $request->query('search')) {
            $baseQuery->where(function ($q) use ($search) {
                $q->whereHas('candidate', function ($candidate) use ($search) {
                    $candidate->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%")
                        ->orWhere('skills', 'like', "%{$search}%");
                })->orWhereHas('opportunity', function ($opportunity) use ($search) {
                    $opportunity->where('title', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%");
                });
            });
        }

        $opportunityId = $request->query('opportunity_id', $request->query('recruiter_opportunity_id'));
        if ($opportunityId) {
            $baseQuery->where('recruiter_opportunity_id', $opportunityId);
        }

        if ($type = $request->query('opportunity_type')) {
            $baseQuery->whereHas('opportunity', fn ($q) => $q->where('opportunity_type', $type));
        }

        if ($interviewStatus = $request->query('interview_status')) {
            $baseQuery->where('interview_status', $interviewStatus);
        }

        if ($from = $request->query('from')) {
            $baseQuery->whereDate('applied_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $baseQuery->whereDate('applied_at', '<=', $to);
        }

        $statusCounts = [];
        foreach (self::STATUSES as $statusKey) {
            $statusCounts[$statusKey] = (clone $baseQuery)->where('status', $statusKey)->count();
        }

        $query = (clone $baseQuery)->with(['candidate', 'opportunity']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        match ($request->query('sort', 'latest')) {
            'oldest' => $query->oldest('applied_at')->oldest(),
            'newest', 'latest' => $query->latest('applied_at')->latest(),
            'rating' => $query->orderByDesc('rating'),
            'status' => $query->orderBy('status'),
            'interview' => $query->orderByRaw('interview_at IS NULL, interview_at ASC'),
            default => $query->latest(),
        };

        $applications = $query->paginate(min((int) $request->query('per_page', 15), 100));
        $applications->getCollection()->transform(fn (RecruiterApplication $application) => $this->transform($user, $application));

        return $this->success($applications, 'Applications retrieved successfully.', 200, [
            'statuses' => self::STATUSES,
            'status_counts' => $statusCounts,
        ]);
    }

    public function store(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'opportunity_id' => 'required_without:recruiter_opportunity_id|integer|exists:recruiter_opportunities,id',
            'recruiter_opportunity_id' => 'required_without:opportunity_id|integer|exists:recruiter_opportunities,id',
            'candidate_id' => 'required|integer|exists:users,id',
            'status' => 'nullable|in:' . implode(',', self::STATUSES),
            'rating' => 'nullable|integer|min:1|max:5',
            'message' => 'nullable|string|max:5000',
            'notes' => 'nullable|string|max:5000',
            'recruiter_notes' => 'nullable|string|max:5000',
            'expected_salary' => 'nullable|numeric|min:0',
            'resume_path' => 'nullable|string|max:500',
            'interview_status' => 'nullable|string|max:100',
            'interview_at' => 'nullable|date',
            'interview_link' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        $opportunityId = $data['opportunity_id'] ?? $data['recruiter_opportunity_id'];
        $opportunity = RecruiterOpportunity::where('user_id', $user->id)->find($opportunityId);

        if (!$opportunity) {
            return $this->forbidden('You do not own this opportunity.');
        }

        if (RecruiterApplication::where('recruiter_opportunity_id', $opportunity->id)->where('candidate_id', $data['candidate_id'])->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Candidate already applied to this opportunity.',
            ], 422);
        }

        $application = DB::transaction(function () use ($data, $opportunity, $user) {
            $application = RecruiterApplication::create([
                'recruiter_opportunity_id' => $opportunity->id,
                'candidate_id' => $data['candidate_id'],
                'status' => $data['status'] ?? 'new',
                'rating' => $data['rating'] ?? null,
                'resume_path' => $data['resume_path'] ?? null,
                'message' => $data['message'] ?? null,
                'recruiter_notes' => $data['recruiter_notes'] ?? $data['notes'] ?? null,
                'expected_salary' => $data['expected_salary'] ?? null,
                'interview_status' => $data['interview_status'] ?? null,
                'interview_at' => $data['interview_at'] ?? null,
                'interview_link' => $data['interview_link'] ?? null,
                'applied_at' => now(),
            ]);

            $opportunity->increment('applications_count');
            $this->workflow->logEvent($application, 'applied', $user, 'Application received');
            $this->notifications->notify($user, 'New application received', ($application->candidate?->name ?? 'A candidate') . ' applied to ' . $opportunity->title, 'application', [
                'recruiter_application_id' => $application->id,
            ]);

            return $application;
        });

        $application->load(['candidate', 'opportunity']);

        return $this->success($this->transform($user, $application, true), 'Application created successfully.', 201);
    }

    public function show(Request $request, int $id)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $application = $this->findOwned($user, $id);
        if (!$application) {
            return $this->notFound('Application not found.');
        }

        $application->load(['candidate', 'opportunity', 'events.actor']);

        return $this->success($this->transform($user, $application, true), 'Application retrieved successfully.');
    }

    public function timeline(Request $request, int $id)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $application = $this->findOwned($user, $id);
        if (! $application) {
            return $this->notFound('Application not found.');
        }

        $events = RecruiterApplicationEvent::with('actor:id,name')
            ->where('recruiter_application_id', $application->id)
            ->latest()
            ->get()
            ->map(fn (RecruiterApplicationEvent $event) => [
                'id' => $event->id,
                'event' => $event->event,
                'from_status' => $event->from_status,
                'to_status' => $event->to_status,
                'note' => $event->note,
                'meta' => $event->meta,
                'actor' => $event->actor ? ['id' => $event->actor->id, 'name' => $event->actor->name] : null,
                'created_at' => $event->created_at?->toIso8601String(),
            ]);

        return $this->success(['timeline' => $events], 'Application timeline retrieved successfully.');
    }

    public function update(Request $request, int $id)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $application = $this->findOwned($user, $id);
        if (!$application) {
            return $this->notFound('Application not found.');
        }

        $validator = Validator::make($request->all(), $this->updateRules());
        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        if (array_key_exists('notes', $data) && !array_key_exists('recruiter_notes', $data)) {
            $data['recruiter_notes'] = $data['notes'];
        }
        unset($data['notes']);

        $from = $application->status;
        $application->fill($data)->save();

        if (isset($data['status']) && $data['status'] !== $from) {
            $this->workflow->logEvent($application, 'status_changed', $user, $data['recruiter_notes'] ?? null, [
                'from' => $from,
                'to' => $data['status'],
            ]);
        } elseif (isset($data['recruiter_notes'])) {
            $this->workflow->logEvent($application, 'notes_updated', $user, $data['recruiter_notes']);
        }

        $application->load(['candidate', 'opportunity']);

        return $this->success($this->transform($user, $application, true), 'Application updated successfully.');
    }

    public function shortlist(Request $request, int $id)
    {
        return $this->statusAction($request, $id, 'shortlisted', 'Application shortlisted successfully.');
    }

    public function underReview(Request $request, int $id)
    {
        return $this->statusAction($request, $id, 'under_review', 'Application moved to under review.');
    }

    public function accept(Request $request, int $id)
    {
        return $this->statusAction($request, $id, 'accepted', 'Application accepted successfully.');
    }

    public function completeInterview(Request $request, int $id)
    {
        return $this->statusAction($request, $id, 'interview_completed', 'Interview marked as completed.');
    }

    public function complete(Request $request, int $id)
    {
        return $this->statusAction($request, $id, 'completed', 'Opportunity marked as completed for this candidate.');
    }

    public function requestInfo(Request $request, int $id)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:5000',
        ]);
        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $application = $this->findOwned($user, $id);
        if (! $application) {
            return $this->notFound('Application not found.');
        }

        $application = $this->workflow->transition(
            $application,
            $application->status === 'new' ? 'under_review' : $application->status,
            $user,
            $request->input('message'),
            ['info_request' => $request->input('message')],
            'info_requested'
        );

        return $this->success($this->transform($user, $application, true), 'Information requested from candidate.');
    }

    public function reject(Request $request, int $id)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:5000',
            'notes' => 'nullable|string|max:5000',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        return $this->statusAction(
            $request,
            $id,
            'rejected',
            'Application rejected successfully.',
            $request->input('reason', $request->input('notes')),
            ['reject_reason' => $request->input('reason', $request->input('notes'))]
        );
    }

    public function hire(Request $request, int $id)
    {
        return $this->statusAction(
            $request,
            $id,
            'hired',
            'Application marked as hired successfully.'
        );
    }

    public function scheduleInterview(Request $request, int $id)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $application = $this->findOwned($user, $id);
        if (!$application) {
            return $this->notFound('Application not found.');
        }

        $validator = Validator::make($request->all(), [
            'interview_at' => 'required|date',
            'interview_link' => 'nullable|string|max:500',
            'interview_status' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:5000',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $application = $this->workflow->transition(
            $application,
            'interview',
            $user,
            $request->input('notes'),
            [
                'interview_status' => $request->input('interview_status', 'scheduled'),
                'interview_at' => $request->input('interview_at'),
                'interview_link' => $request->input('interview_link'),
                'recruiter_notes' => $request->input('notes', $application->recruiter_notes),
            ],
            'interview_scheduled'
        );

        return $this->success($this->transform($user, $application, true), 'Interview scheduled successfully.');
    }

    public function bulkUpdate(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|distinct',
            'action' => 'nullable|in:shortlist,reject,schedule_interview,update',
            'status' => 'nullable|in:' . implode(',', self::STATUSES),
            'rating' => 'nullable|integer|min:1|max:5',
            'notes' => 'nullable|string|max:5000',
            'recruiter_notes' => 'nullable|string|max:5000',
            'interview_at' => 'nullable|date',
            'interview_link' => 'nullable|string|max:500',
            'interview_status' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        if ($request->input('action') === 'schedule_interview' && !$request->filled('interview_at')) {
            return $this->validationError(['interview_at' => ['The interview_at field is required when scheduling interviews.']]);
        }

        $opportunityIds = RecruiterOpportunity::where('user_id', $user->id)->pluck('id');
        $applications = RecruiterApplication::whereIn('recruiter_opportunity_id', $opportunityIds)
            ->whereIn('id', $request->input('ids'))
            ->get();

        $updated = 0;
        foreach ($applications as $application) {
            $extra = [];

            if ($request->filled('rating')) {
                $extra['rating'] = $request->input('rating');
            }
            if ($request->filled('notes') || $request->filled('recruiter_notes')) {
                $extra['recruiter_notes'] = $request->input('recruiter_notes', $request->input('notes'));
            }
            if ($request->filled('interview_at')) {
                $extra['interview_at'] = $request->input('interview_at');
            }
            if ($request->filled('interview_link')) {
                $extra['interview_link'] = $request->input('interview_link');
            }
            if ($request->filled('interview_status')) {
                $extra['interview_status'] = $request->input('interview_status');
            }

            $status = match ($request->input('action')) {
                'shortlist' => 'shortlisted',
                'reject' => 'rejected',
                'schedule_interview' => 'interview',
                default => $request->input('status', $application->status),
            };

            if ($request->input('action') === 'schedule_interview') {
                $extra['interview_status'] = $extra['interview_status'] ?? 'scheduled';
            }
            if ($request->input('action') === 'reject' && ($request->filled('notes') || $request->filled('recruiter_notes'))) {
                $extra['reject_reason'] = $request->input('recruiter_notes', $request->input('notes'));
            }

            if ($status !== $application->status) {
                $this->workflow->transition(
                    $application,
                    $status,
                    $user,
                    $extra['recruiter_notes'] ?? null,
                    $extra,
                    match ($request->input('action')) {
                        'shortlist' => 'shortlisted',
                        'reject' => 'rejected',
                        'schedule_interview' => 'interview_scheduled',
                        default => 'status_changed',
                    }
                );
            } elseif ($extra !== []) {
                $application->forceFill($extra)->save();
                $this->workflow->logEvent($application, 'bulk_updated', $user, $extra['recruiter_notes'] ?? null, $extra);
            }

            $updated++;
        }

        return $this->success([
            'matched' => $applications->count(),
            'updated' => $updated,
        ], 'Applications updated successfully.');
    }

    private function statusAction(
        Request $request,
        int $id,
        string $status,
        string $message,
        ?string $notes = null,
        array $extra = [],
    ) {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $application = $this->findOwned($user, $id);
        if (!$application) {
            return $this->notFound('Application not found.');
        }

        if ($notes !== null) {
            $extra['recruiter_notes'] = $notes;
        }

        $application = $this->workflow->transition($application, $status, $user, $notes, $extra);

        return $this->success($this->transform($user, $application, true), $message);
    }

    private function findOwned(User $user, int $id): ?RecruiterApplication
    {
        $opportunityIds = RecruiterOpportunity::where('user_id', $user->id)->pluck('id');

        return RecruiterApplication::with(['candidate', 'opportunity'])
            ->whereIn('recruiter_opportunity_id', $opportunityIds)
            ->find($id);
    }

    private function updateRules(): array
    {
        return [
            'status' => 'nullable|in:' . implode(',', self::STATUSES),
            'rating' => 'nullable|integer|min:1|max:5',
            'notes' => 'nullable|string|max:5000',
            'recruiter_notes' => 'nullable|string|max:5000',
            'expected_salary' => 'nullable|numeric|min:0',
            'interview_status' => 'nullable|string|max:100',
            'interview_at' => 'nullable|date',
            'interview_link' => 'nullable|string|max:500',
            'info_request' => 'nullable|string|max:5000',
            'reject_reason' => 'nullable|string|max:5000',
        ];
    }

    private function transform(User $recruiter, RecruiterApplication $application, bool $detailed = false): array
    {
        $candidate = $application->candidate;
        $unlocked = $candidate
            ? $this->unlocks->hasUnlocked($recruiter, $candidate->id, $application->id)
            : false;

        $candidatePayload = null;
        if ($candidate) {
            $candidatePayload = [
                'id' => $candidate->id,
                'name' => $candidate->name,
                'headline' => $candidate->current_role ?: $candidate->bio,
                'photo' => $this->mediaUrl($candidate->profile_photo),
                'profile_photo' => $this->mediaUrl($candidate->profile_photo),
                'skills' => $candidate->skills,
                'experience' => $candidate->experience,
                'education' => $candidate->education,
                'location' => $candidate->location,
                'resume_url' => $this->mediaUrl($candidate->resume_path),
                'projects' => $candidate->projects,
                'certificates' => $candidate->certificates,
                'languages' => $candidate->languages,
                'bio' => $candidate->bio,
                'contact_unlocked' => $unlocked,
            ];

            if ($unlocked || $detailed === false) {
                // List views may still hide contacts; detail reveals only when unlocked.
            }

            if ($unlocked) {
                $candidatePayload['email'] = $candidate->email;
                $candidatePayload['mobile'] = $candidate->mobile;
                $candidatePayload['linkedin'] = $candidate->linkedin;
                $candidatePayload['github'] = $candidate->github;
                $candidatePayload['portfolio'] = $candidate->portfolio;
            } else {
                $candidatePayload['email'] = null;
                $candidatePayload['mobile'] = null;
                $candidatePayload['linkedin'] = $candidate->linkedin ? 'Locked' : null;
                $candidatePayload['github'] = null;
                $candidatePayload['portfolio'] = $candidate->portfolio ? 'Locked' : null;
            }
        }

        $payload = [
            'id' => $application->id,
            'recruiter_opportunity_id' => $application->recruiter_opportunity_id,
            'candidate_id' => $application->candidate_id,
            'status' => $application->status,
            'status_label' => str_replace('_', ' ', ucfirst($application->status === 'new' ? 'applied' : $application->status)),
            'rating' => $application->rating,
            'message' => $application->message,
            'notes' => $application->recruiter_notes,
            'recruiter_notes' => $application->recruiter_notes,
            'reject_reason' => $application->reject_reason,
            'info_request' => $application->info_request,
            'expected_salary' => $application->expected_salary !== null ? (float) $application->expected_salary : null,
            'resume_url' => $application->resumeUrl(),
            'interview_status' => $application->interview_status,
            'interview_at' => $application->interview_at,
            'interview_link' => $application->interview_link,
            'hired_at' => $application->hired_at,
            'completed_at' => $application->completed_at,
            'applied_at' => $application->applied_at ?? $application->created_at,
            'created_at' => $application->created_at,
            'updated_at' => $application->updated_at,
            'contact_unlocked' => $unlocked,
            'contact_price' => (float) ($application->opportunity?->contact_price ?? 49),
            'candidate' => $candidatePayload,
            'opportunity' => $application->opportunity ? [
                'id' => $application->opportunity->id,
                'title' => $application->opportunity->title,
                'company_name' => $application->opportunity->company_name,
                'location' => $application->opportunity->location,
                'status' => $application->opportunity->status,
                'opportunity_type' => $application->opportunity->opportunity_type,
                'contact_price' => (float) ($application->opportunity->contact_price ?? 49),
            ] : null,
            'meta' => [
                'can_shortlist' => ! in_array($application->status, ['shortlisted', 'hired', 'completed', 'rejected', 'withdrawn'], true),
                'can_reject' => ! in_array($application->status, ['rejected', 'withdrawn', 'hired', 'completed'], true),
                'can_schedule_interview' => ! in_array($application->status, ['rejected', 'withdrawn', 'hired', 'completed'], true),
                'can_hire' => ! in_array($application->status, ['hired', 'completed', 'rejected', 'withdrawn'], true),
                'can_unlock_contact' => ! $unlocked,
            ],
        ];

        if ($detailed) {
            $previous = RecruiterApplication::with('opportunity:id,title,opportunity_type')
                ->where('candidate_id', $application->candidate_id)
                ->where('id', '!=', $application->id)
                ->whereIn('recruiter_opportunity_id', RecruiterOpportunity::where('user_id', $recruiter->id)->pluck('id'))
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn (RecruiterApplication $prev) => [
                    'id' => $prev->id,
                    'status' => $prev->status,
                    'applied_at' => $prev->applied_at,
                    'opportunity' => $prev->opportunity ? [
                        'id' => $prev->opportunity->id,
                        'title' => $prev->opportunity->title,
                        'opportunity_type' => $prev->opportunity->opportunity_type,
                    ] : null,
                ]);

            $timeline = $application->relationLoaded('events')
                ? $application->events
                : RecruiterApplicationEvent::with('actor:id,name')
                    ->where('recruiter_application_id', $application->id)
                    ->latest()
                    ->limit(30)
                    ->get();

            $payload['previous_applications'] = $previous;
            $payload['timeline'] = $timeline->map(fn (RecruiterApplicationEvent $event) => [
                'id' => $event->id,
                'event' => $event->event,
                'from_status' => $event->from_status,
                'to_status' => $event->to_status,
                'note' => $event->note,
                'actor' => $event->actor ? ['id' => $event->actor->id, 'name' => $event->actor->name] : null,
                'created_at' => $event->created_at?->toIso8601String(),
            ])->values();
            $payload['profile_strength'] = $this->profileStrength($candidate);
        }

        return $payload;
    }

    private function profileStrength(?User $candidate): int
    {
        if (! $candidate) {
            return 0;
        }

        $fields = [
            $candidate->name,
            $candidate->email,
            $candidate->mobile,
            $candidate->bio,
            $candidate->experience,
            $candidate->education,
            $candidate->skills,
            $candidate->resume_path,
            $candidate->linkedin,
            $candidate->portfolio,
            $candidate->profile_photo,
            $candidate->location,
        ];
        $filled = collect($fields)->filter(fn ($v) => filled($v))->count();

        return (int) round(($filled / max(count($fields), 1)) * 100);
    }
}
