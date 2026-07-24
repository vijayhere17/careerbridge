<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRApplication;
use App\Models\HRApplicationTimeline;
use App\Models\HRInterview;
use App\Models\HRJob;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Throwable;

class HRInterviewController extends HRBaseController
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

        $validator = Validator::make($request->query(), [
            'status' => 'nullable|in:scheduled,completed,cancelled,no_show',
            'upcoming' => 'nullable|boolean',
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $query = HRInterview::with(['application.candidate', 'application.job'])
            ->where('hr_id', $user->id)
            ->whereHas('application', fn ($q) => $q->whereIn('job_id', $this->ownedJobIds($user)));

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($request->boolean('upcoming')) {
            $query->where('status', 'scheduled')
                ->where('scheduled_at', '>=', now());
        }

        if ($from = $request->query('from')) {
            $query->whereDate('scheduled_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->whereDate('scheduled_at', '<=', $to);
        }

        $perPage = min((int) $request->query('per_page', 20), 100);
        $interviews = $query->orderBy('scheduled_at')->paginate($perPage);
        $interviews->getCollection()->transform(fn (HRInterview $interview) => $this->transform($interview));

        return $this->success($interviews, 'Interviews retrieved successfully.');
    }

    public function calendar(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $validator = Validator::make($request->query(), [
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $query = HRInterview::with(['application.candidate', 'application.job'])
            ->where('hr_id', $user->id)
            ->whereHas('application', fn ($q) => $q->whereIn('job_id', $this->ownedJobIds($user)));

        if ($from = $request->query('from')) {
            $query->whereDate('scheduled_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->whereDate('scheduled_at', '<=', $to);
        }

        $interviews = $query->orderBy('scheduled_at')->get();
        $grouped = $interviews
            ->groupBy(fn (HRInterview $interview) => $interview->scheduled_at->toDateString())
            ->map(fn ($items, $date) => [
                'date' => $date,
                'count' => $items->count(),
                'interviews' => $items->map(fn (HRInterview $interview) => $this->transform($interview))->values(),
            ])
            ->values();

        return $this->success([
            'from' => $request->query('from'),
            'to' => $request->query('to'),
            'dates' => $grouped,
        ], 'Interview calendar retrieved successfully.');
    }

    public function store(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $validator = Validator::make($request->all(), $this->rules(true));

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $application = $this->findOwnedApplication($user, (int) $data['application_id']);

        if (!$application) {
            return $this->forbidden('Application not found in your jobs.');
        }

        $interview = HRInterview::create([
            'application_id' => $application->id,
            'hr_id' => $user->id,
            'interviewer_name' => $data['interviewer_name'] ?? null,
            'panel' => $data['panel'] ?? [],
            'interview_type' => $data['interview_type'] ?? null,
            'meeting_link' => $data['meeting_link'] ?? null,
            'scheduled_at' => $data['scheduled_at'],
            'duration' => $data['duration'] ?? 30,
            'status' => $data['status'] ?? 'scheduled',
            'feedback' => $data['feedback'] ?? null,
            'notes' => $data['notes'] ?? null,
            'rating' => $data['rating'] ?? null,
            'result' => $data['result'] ?? null,
        ]);

        $application->forceFill([
            'interview_date' => $interview->scheduled_at,
            'interview_mode' => $interview->interview_type,
            'interview_link' => $interview->meeting_link,
        ])->save();

        $this->recordTimeline($application, 'interview_scheduled', $user->id, 'Interview scheduled', [
            'interview_id' => $interview->id,
            'scheduled_at' => optional($interview->scheduled_at)->toDateTimeString(),
            'panel' => $interview->panel,
        ]);

        $interview->load(['application.candidate', 'application.job']);
        $this->logActivity($user, 'scheduled', 'interviews', "Scheduled interview #{$interview->id}");

        return $this->success($this->transform($interview), 'Interview scheduled.', 201);
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

        $interview = $this->findOwnedInterview($user, $id);

        if (!$interview) {
            return $this->notFound('Interview not found.');
        }

        return $this->success($this->transform($interview));
    }

    public function update(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $interview = $this->findOwnedInterview($user, $id);

        if (!$interview) {
            return $this->notFound('Interview not found.');
        }

        $validator = Validator::make($request->all(), $this->rules(false));

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        unset($data['application_id']);

        $previousScheduledAt = optional($interview->scheduled_at)->toDateTimeString();
        $interview->fill($data)->save();

        if (array_key_exists('scheduled_at', $data) && $interview->application) {
            $interview->application->forceFill([
                'interview_date' => $interview->scheduled_at,
                'interview_mode' => $interview->interview_type,
                'interview_link' => $interview->meeting_link,
            ])->save();

            $this->recordTimeline($interview->application, 'interview_updated', $user->id, 'Interview schedule updated', [
                'interview_id' => $interview->id,
                'from' => $previousScheduledAt,
                'to' => optional($interview->scheduled_at)->toDateTimeString(),
            ]);
        }

        $interview->load(['application.candidate', 'application.job']);
        $this->logActivity($user, 'updated', 'interviews', "Updated interview #{$interview->id}");

        return $this->success($this->transform($interview), 'Interview updated.');
    }

    public function complete(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $interview = $this->findOwnedInterview($user, $id);

        if (!$interview) {
            return $this->notFound('Interview not found.');
        }

        $validator = Validator::make($request->all(), [
            'feedback' => 'nullable|string',
            'rating' => 'nullable|integer|min:1|max:5',
            'result' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $interview->markCompleted($data['feedback'] ?? null, $data['rating'] ?? null, $data['result'] ?? null);

        if ($interview->application) {
            $updates = ['interviewer_notes' => $data['feedback'] ?? $interview->application->interviewer_notes];
            if (isset($data['rating'])) {
                $updates['rating'] = $data['rating'];
            }
            $interview->application->forceFill($updates)->save();

            $this->recordTimeline($interview->application, 'interview_completed', $user->id, 'Interview completed', [
                'interview_id' => $interview->id,
                'rating' => $data['rating'] ?? null,
                'result' => $data['result'] ?? null,
            ]);
        }

        $interview->load(['application.candidate', 'application.job']);
        $this->logActivity($user, 'completed', 'interviews', "Completed interview #{$interview->id}");

        return $this->success($this->transform($interview), 'Interview completed.');
    }

    public function cancel(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $interview = $this->findOwnedInterview($user, $id);

        if (!$interview) {
            return $this->notFound('Interview not found.');
        }

        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $interview->cancel($validator->validated()['notes'] ?? null);

        if ($interview->application) {
            $this->recordTimeline($interview->application, 'interview_cancelled', $user->id, 'Interview cancelled', [
                'interview_id' => $interview->id,
                'notes' => $interview->notes,
            ]);
        }

        $interview->load(['application.candidate', 'application.job']);
        $this->logActivity($user, 'cancelled', 'interviews', "Cancelled interview #{$interview->id}");

        return $this->success($this->transform($interview), 'Interview cancelled.');
    }

    public function reschedule(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $interview = $this->findOwnedInterview($user, $id);

        if (!$interview) {
            return $this->notFound('Interview not found.');
        }

        $validator = Validator::make($request->all(), [
            'scheduled_at' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $previousScheduledAt = optional($interview->scheduled_at)->toDateTimeString();
        $interview->reschedule($validator->validated()['scheduled_at']);

        if ($interview->application) {
            $interview->application->forceFill([
                'interview_date' => $interview->scheduled_at,
                'interview_mode' => $interview->interview_type,
                'interview_link' => $interview->meeting_link,
            ])->save();

            $this->recordTimeline($interview->application, 'interview_rescheduled', $user->id, 'Interview rescheduled', [
                'interview_id' => $interview->id,
                'from' => $previousScheduledAt,
                'to' => optional($interview->scheduled_at)->toDateTimeString(),
            ]);
        }

        $interview->load(['application.candidate', 'application.job']);
        $this->logActivity($user, 'rescheduled', 'interviews', "Rescheduled interview #{$interview->id}");

        return $this->success($this->transform($interview), 'Interview rescheduled.');
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $interview = $this->findOwnedInterview($user, $id);

        if (!$interview) {
            return $this->notFound('Interview not found.');
        }

        $application = $interview->application;
        $interviewId = $interview->id;
        $interview->delete();

        if ($application) {
            $this->recordTimeline($application, 'interview_deleted', $user->id, 'Interview deleted', [
                'interview_id' => $interviewId,
            ]);
        }

        $this->logActivity($user, 'deleted', 'interviews', "Deleted interview #{$interviewId}");

        return $this->success(null, 'Interview deleted.');
    }

    private function rules(bool $creating): array
    {
        return [
            'application_id' => ($creating ? 'required' : 'sometimes') . '|integer|exists:hr_applications,id',
            'interviewer_name' => 'nullable|string|max:255',
            'panel' => 'nullable|array',
            'panel.*' => 'string|max:255',
            'interview_type' => 'nullable|string|max:100',
            'meeting_link' => 'nullable|string|max:500',
            'scheduled_at' => ($creating ? 'required' : 'nullable') . '|date',
            'duration' => 'nullable|integer|min:15|max:480',
            'status' => 'nullable|in:scheduled,completed,cancelled,no_show',
            'feedback' => 'nullable|string',
            'notes' => 'nullable|string|max:5000',
            'rating' => 'nullable|integer|min:1|max:5',
            'result' => 'nullable|string|max:100',
        ];
    }

    private function findOwnedApplication(User $user, int $applicationId): ?HRApplication
    {
        return HRApplication::whereIn('job_id', $this->ownedJobIds($user))->find($applicationId);
    }

    private function findOwnedInterview(User $user, int $id): ?HRInterview
    {
        return HRInterview::with(['application.candidate', 'application.job'])
            ->where('hr_id', $user->id)
            ->whereHas('application', fn ($q) => $q->whereIn('job_id', $this->ownedJobIds($user)))
            ->find($id);
    }

    private function ownedJobIds(User $user)
    {
        return HRJob::where('hr_id', $user->id)->pluck('id');
    }

    private function recordTimeline(HRApplication $application, string $event, int $hrId, string $description, array $meta = []): void
    {
        try {
            HRApplicationTimeline::record(
                $application->id,
                $event,
                $hrId,
                $application->current_stage,
                $application->current_stage,
                $description,
                $meta
            );
        } catch (Throwable $e) {
            report($e);
        }
    }

    private function transform(HRInterview $interview): array
    {
        return [
            'id' => $interview->id,
            'application_id' => $interview->application_id,
            'hr_id' => $interview->hr_id,
            'interviewer_name' => $interview->interviewer_name,
            'panel' => $interview->panel ?? [],
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
            'created_at' => $interview->created_at,
            'updated_at' => $interview->updated_at,
            'candidate' => $interview->application?->candidate ? [
                'id' => $interview->application->candidate->id,
                'name' => $interview->application->candidate->name,
                'email' => $interview->application->candidate->email,
                'mobile' => $interview->application->candidate->mobile,
                'location' => $interview->application->candidate->location,
                'profile_photo' => $this->mediaUrl($interview->application->candidate->profile_photo),
            ] : null,
            'job' => $interview->application?->job ? [
                'id' => $interview->application->job->id,
                'title' => $interview->application->job->title,
                'department' => $interview->application->job->department,
                'location' => $interview->application->job->location,
            ] : null,
            'application' => $interview->application ? [
                'id' => $interview->application->id,
                'current_stage' => $interview->application->current_stage,
                'stage_label' => HRApplication::STAGE_LABELS[$interview->application->current_stage] ?? $interview->application->current_stage,
                'rating' => $interview->application->rating,
            ] : null,
        ];
    }
}
