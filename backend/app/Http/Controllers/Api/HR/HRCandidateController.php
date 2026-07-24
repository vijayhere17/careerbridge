<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRApplication;
use App\Models\HRCandidateNote;
use App\Models\HRInterview;
use App\Models\HRJob;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Throwable;

class HRCandidateController extends HRBaseController
{
    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        try {
            $validator = Validator::make($request->query(), [
                'search' => 'nullable|string|max:255',
                'stage' => 'nullable|in:' . implode(',', HRApplication::STAGES),
                'rating' => 'nullable|integer|min:1|max:5',
                'location' => 'nullable|string|max:255',
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $jobIds = $this->ownedJobIds($user);
            $candidateIds = HRApplication::query()
                ->whereIn('job_id', $jobIds)
                ->when($request->query('stage'), fn ($q, $stage) => $q->where('current_stage', $stage))
                ->when($request->query('rating'), fn ($q, $rating) => $q->where('rating', '>=', (int) $rating))
                ->select('candidate_id')
                ->distinct();

            $query = User::query()->whereIn('id', $candidateIds);

            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('current_role', 'like', "%{$search}%")
                        ->orWhere('skills', 'like', "%{$search}%");
                });
            }

            if ($location = $request->query('location')) {
                $query->where('location', 'like', "%{$location}%");
            }

            $perPage = min((int) $request->query('per_page', 15), 100);
            $candidates = $query->orderByDesc('updated_at')->paginate($perPage);

            $applicationsByCandidate = HRApplication::with(['job', 'interviews'])
                ->whereIn('job_id', $jobIds)
                ->whereIn('candidate_id', $candidates->getCollection()->pluck('id'))
                ->latest()
                ->get()
                ->groupBy('candidate_id');

            $candidates->getCollection()->transform(function (User $candidate) use ($applicationsByCandidate) {
                $applications = $applicationsByCandidate->get($candidate->id, collect());

                return [
                    'id' => $candidate->id,
                    'name' => $candidate->name,
                    'email' => $candidate->email,
                    'mobile' => $candidate->mobile,
                    'location' => $candidate->location,
                    'current_role' => $candidate->current_role,
                    'experience' => $candidate->experience,
                    'education' => $candidate->education,
                    'skills' => $this->arrayValue($candidate->skills),
                    'tags' => $this->arrayValue($candidate->tags),
                    'resume_url' => $this->mediaUrl($candidate->resume_path),
                    'profile_photo' => $this->mediaUrl($candidate->profile_photo),
                    'applications_count' => $applications->count(),
                    'latest_application_id' => $applications->first()?->id,
                    'latest_stage' => $applications->first()?->current_stage,
                    'latest_stage_label' => HRApplication::STAGE_LABELS[$applications->first()?->current_stage] ?? null,
                    'latest_job' => $applications->first()?->job ? [
                        'id' => $applications->first()->job->id,
                        'title' => $applications->first()->job->title,
                        'department' => $applications->first()->job->department,
                    ] : null,
                    'avg_rating' => round((float) $applications->avg('rating'), 1),
                    'interviews_count' => $applications->flatMap(fn (HRApplication $app) => $app->interviews)->count(),
                    'updated_at' => $candidate->updated_at,
                ];
            });

            return $this->success($candidates, 'Candidates retrieved successfully.', 200, [
                'filters' => [
                    'stages' => HRApplication::STAGES,
                    'stage_labels' => HRApplication::STAGE_LABELS,
                ],
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Unable to load candidates.',
            ], 500);
        }
    }

    public function show(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $candidate = User::find($id);

        if (!$candidate) {
            return $this->notFound('Candidate not found.');
        }

        $applications = $this->ownedApplicationsForCandidate($user, $id)
            ->with(['job', 'timeline', 'interviews'])
            ->latest()
            ->get();

        if ($applications->isEmpty()) {
            return $this->forbidden('Candidate not in your pipeline.');
        }

        $applicationIds = $applications->pluck('id');

        $interviews = HRInterview::with(['application.job', 'application.candidate'])
            ->where('hr_id', $user->id)
            ->whereIn('application_id', $applicationIds)
            ->orderByDesc('scheduled_at')
            ->get();

        $notes = HRCandidateNote::where('hr_id', $user->id)
            ->where('candidate_id', $candidate->id)
            ->latest()
            ->get()
            ->map(fn (HRCandidateNote $note) => $this->transformNote($note));

        $timeline = $applications
            ->flatMap(fn (HRApplication $application) => $application->timeline->map(function ($event) use ($application) {
                return [
                    'id' => $event->id,
                    'application_id' => $application->id,
                    'job' => $application->job ? [
                        'id' => $application->job->id,
                        'title' => $application->job->title,
                    ] : null,
                    'event' => $event->event,
                    'from_stage' => $event->from_stage,
                    'to_stage' => $event->to_stage,
                    'to_stage_label' => HRApplication::STAGE_LABELS[$event->to_stage] ?? $event->to_stage,
                    'description' => $event->description,
                    'meta' => $event->meta,
                    'created_at' => $event->created_at,
                ];
            }))
            ->sortByDesc('created_at')
            ->values();

        return $this->success([
            'candidate' => $this->transformCandidate($candidate),
            'application_history' => $applications->map(fn (HRApplication $application) => $this->transformApplication($application))->values(),
            'applications' => $applications->map(fn (HRApplication $application) => $this->transformApplication($application))->values(),
            'interview_history' => $interviews->map(fn (HRInterview $interview) => $this->transformInterview($interview))->values(),
            'interviews' => $interviews->map(fn (HRInterview $interview) => $this->transformInterview($interview))->values(),
            'timeline' => $timeline,
            'ratings' => [
                'average' => round((float) $applications->avg('rating'), 1),
                'count' => $applications->whereNotNull('rating')->count(),
                'items' => $applications->whereNotNull('rating')->map(fn (HRApplication $application) => [
                    'application_id' => $application->id,
                    'job_id' => $application->job_id,
                    'job_title' => $application->job?->title,
                    'rating' => $application->rating,
                    'stage' => $application->current_stage,
                    'stage_label' => HRApplication::STAGE_LABELS[$application->current_stage] ?? $application->current_stage,
                    'updated_at' => $application->updated_at,
                ])->values(),
            ],
            'notes' => $notes,
        ], 'Candidate retrieved successfully.');
    }

    public function storeNote(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $validator = Validator::make($request->all(), [
            'note' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if (!$this->candidateBelongsToHr($user, $id)) {
            return $this->forbidden('Candidate not in your pipeline.');
        }

        $note = HRCandidateNote::create([
            'hr_id' => $user->id,
            'candidate_id' => $id,
            'note' => $validator->validated()['note'],
        ]);

        $this->logActivity($user, 'created', 'notes', "Added note for candidate #{$id}");

        return $this->success($this->transformNote($note), 'Note added.', 201);
    }

    public function destroyNote(Request $request, int $candidateId, int $noteId)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        if (!$this->candidateBelongsToHr($user, $candidateId)) {
            return $this->forbidden('Candidate not in your pipeline.');
        }

        $note = HRCandidateNote::where('hr_id', $user->id)
            ->where('candidate_id', $candidateId)
            ->find($noteId);

        if (!$note) {
            return $this->notFound('Note not found.');
        }

        $note->delete();
        $this->logActivity($user, 'deleted', 'notes', "Deleted note #{$noteId} for candidate #{$candidateId}");

        return $this->success(null, 'Note deleted.');
    }

    public function updateTags(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $validator = Validator::make($request->all(), [
            'tags' => 'required|array',
            'tags.*' => 'string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $candidate = User::find($id);

        if (!$candidate) {
            return $this->notFound('Candidate not found.');
        }

        if (!$this->candidateBelongsToHr($user, $id)) {
            return $this->forbidden('Candidate not in your pipeline.');
        }

        $tags = collect($validator->validated()['tags'])
            ->map(fn ($tag) => trim((string) $tag))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $candidate->forceFill(['tags' => $tags])->save();
        $this->logActivity($user, 'updated', 'candidates', "Updated tags for candidate #{$id}");

        return $this->success([
            'candidate_id' => $candidate->id,
            'tags' => $tags,
        ], 'Candidate tags updated.');
    }

    private function ownedJobIds(User $user): Collection
    {
        return HRJob::where('hr_id', $user->id)->pluck('id');
    }

    private function ownedApplicationsForCandidate(User $user, int $candidateId)
    {
        return HRApplication::query()
            ->whereIn('job_id', $this->ownedJobIds($user))
            ->where('candidate_id', $candidateId);
    }

    private function candidateBelongsToHr(User $user, int $candidateId): bool
    {
        return $this->ownedApplicationsForCandidate($user, $candidateId)->exists();
    }

    private function transformCandidate(User $candidate): array
    {
        return [
            'id' => $candidate->id,
            'name' => $candidate->name,
            'last_name' => $candidate->last_name,
            'email' => $candidate->email,
            'mobile' => $candidate->mobile,
            'company' => $candidate->company,
            'current_role' => $candidate->current_role,
            'target_roles' => $candidate->target_roles,
            'location' => $candidate->location,
            'bio' => $candidate->bio,
            'experience' => $candidate->experience,
            'education' => $candidate->education,
            'skills' => $this->arrayValue($candidate->skills),
            'resume_url' => $this->mediaUrl($candidate->resume_path),
            'projects' => $this->arrayValue($candidate->projects),
            'certificates' => $this->arrayValue($candidate->certificates),
            'portfolio' => $candidate->portfolio,
            'linkedin' => $candidate->linkedin,
            'github' => $candidate->github,
            'languages' => $this->arrayValue($candidate->languages),
            'tags' => $this->arrayValue($candidate->tags),
            'looking_for' => $this->arrayValue($candidate->looking_for),
            'profile_photo' => $this->mediaUrl($candidate->profile_photo),
            'created_at' => $candidate->created_at,
            'updated_at' => $candidate->updated_at,
        ];
    }

    private function transformApplication(HRApplication $application): array
    {
        return [
            'id' => $application->id,
            'job_id' => $application->job_id,
            'candidate_id' => $application->candidate_id,
            'source' => $application->source,
            'expected_salary' => $application->expected_salary,
            'current_stage' => $application->current_stage,
            'stage_label' => HRApplication::STAGE_LABELS[$application->current_stage] ?? $application->current_stage,
            'rating' => $application->rating,
            'resume_url' => $application->resumeUrl(),
            'applied_at' => $application->applied_at ?? $application->created_at,
            'shortlisted_at' => $application->shortlisted_at,
            'rejected_at' => $application->rejected_at,
            'offer_sent_at' => $application->offer_sent_at,
            'stage_changed_at' => $application->stage_changed_at,
            'interview_date' => $application->interview_date,
            'interview_mode' => $application->interview_mode,
            'interview_link' => $application->interview_link,
            'interviewer_notes' => $application->interviewer_notes,
            'hr_notes' => $application->hr_notes,
            'offer_salary' => $application->offer_salary,
            'offer_status' => $application->offer_status,
            'joined_date' => $application->joined_date,
            'rejected_reason' => $application->rejected_reason,
            'created_at' => $application->created_at,
            'updated_at' => $application->updated_at,
            'job' => $application->job ? [
                'id' => $application->job->id,
                'title' => $application->job->title,
                'department' => $application->job->department,
                'location' => $application->job->location,
                'status' => $application->job->status,
            ] : null,
        ];
    }

    private function transformInterview(HRInterview $interview): array
    {
        return [
            'id' => $interview->id,
            'application_id' => $interview->application_id,
            'interviewer_name' => $interview->interviewer_name,
            'panel' => $this->arrayValue($interview->panel),
            'interview_type' => $interview->interview_type,
            'meeting_link' => $interview->meeting_link,
            'scheduled_at' => $interview->scheduled_at,
            'duration' => $interview->duration,
            'status' => $interview->status,
            'feedback' => $interview->feedback,
            'notes' => $interview->notes,
            'rating' => $interview->rating,
            'result' => $interview->result,
            'completed_at' => $interview->completed_at,
            'cancelled_at' => $interview->cancelled_at,
            'rescheduled_at' => $interview->rescheduled_at,
            'job' => $interview->application?->job ? [
                'id' => $interview->application->job->id,
                'title' => $interview->application->job->title,
                'department' => $interview->application->job->department,
            ] : null,
            'created_at' => $interview->created_at,
            'updated_at' => $interview->updated_at,
        ];
    }

    private function transformNote(HRCandidateNote $note): array
    {
        return [
            'id' => $note->id,
            'hr_id' => $note->hr_id,
            'candidate_id' => $note->candidate_id,
            'note' => $note->note,
            'created_at' => $note->created_at,
            'updated_at' => $note->updated_at,
        ];
    }

    private function arrayValue(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if ($value instanceof Collection) {
            return $value->values()->all();
        }

        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? $decoded : array_values(array_filter(array_map('trim', explode(',', $value))));
        }

        return [];
    }
}
