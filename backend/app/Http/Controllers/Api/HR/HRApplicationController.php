<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRApplication;
use App\Models\HRApplicationTimeline;
use App\Models\HRJob;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class HRApplicationController extends HRBaseController
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

        $jobIds = HRJob::where('hr_id', $user->id)->pluck('id');
        $query = HRApplication::with(['candidate', 'job', 'interviews'])
            ->whereIn('job_id', $jobIds);

        if ($search = $request->query('search')) {
            $query->whereHas('candidate', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($stage = $request->query('stage')) {
            $query->where('current_stage', $stage);
        }

        if ($jobId = $request->query('job_id')) {
            $query->where('job_id', $jobId);
        }

        if ($rating = $request->query('rating')) {
            $query->where('rating', '>=', (int) $rating);
        }

        if ($source = $request->query('source')) {
            $query->where('source', $source);
        }

        if ($offerStatus = $request->query('offer_status')) {
            $query->where('offer_status', $offerStatus);
        }

        if ($from = $request->query('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $sort = $request->query('sort', 'latest');
        match ($sort) {
            'rating' => $query->orderByDesc('rating'),
            'oldest' => $query->oldest(),
            'stage' => $query->orderBy('current_stage'),
            default => $query->latest(),
        };

        $perPage = min((int) $request->query('per_page', 15), 50);
        $applications = $query->paginate($perPage);
        $applications->getCollection()->transform(fn (HRApplication $app) => $this->transform($app));

        return $this->success($applications, 'OK', 200, [
            'stages' => HRApplication::STAGES,
            'stage_labels' => HRApplication::STAGE_LABELS,
        ]);
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

        $validator = Validator::make($request->all(), [
            'job_id' => 'required|exists:hr_jobs,id',
            'candidate_id' => 'required|exists:users,id',
            'current_stage' => 'nullable|in:' . implode(',', HRApplication::STAGES),
            'rating' => 'nullable|integer|min:1|max:5',
            'hr_notes' => 'nullable|string',
            'source' => 'nullable|string|max:100',
            'expected_salary' => 'nullable|numeric|min:0',
            'resume' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $job = HRJob::where('hr_id', $user->id)->find($request->job_id);
        if (!$job) {
            return $this->forbidden('You do not own this job.');
        }

        if (HRApplication::where('job_id', $job->id)->where('candidate_id', $request->candidate_id)->exists()) {
            return response()->json(['success' => false, 'message' => 'Candidate already applied to this job.'], 422);
        }

        $resumePath = null;
        if ($request->hasFile('resume')) {
            $resumePath = $request->file('resume')->store('hr/resumes', 'public');
        }

        $application = HRApplication::create([
            'job_id' => $job->id,
            'candidate_id' => $request->candidate_id,
            'current_stage' => $request->current_stage ?? 'applied',
            'rating' => $request->rating,
            'hr_notes' => $request->hr_notes,
            'source' => $request->source,
            'expected_salary' => $request->expected_salary,
            'resume_path' => $resumePath,
            'applied_at' => now(),
            'stage_changed_at' => now(),
        ]);

        HRApplicationTimeline::record(
            $application->id,
            'created',
            $user->id,
            null,
            $application->current_stage,
            'Application created'
        );

        $application->load(['candidate', 'job']);
        $this->logActivity($user, 'created', 'applications', "Added application #{$application->id}");

        return $this->success($this->transform($application, true), 'Application created.', 201);
    }

    public function show(Request $request, int $id)
    {
        $user = $this->authUser($request);
        if (!$user) {
            return $this->unauthorized();
        }

        $application = $this->findOwned($user, $id);
        if (!$application) {
            return $this->notFound('Application not found.');
        }

        $application->load(['candidate', 'job', 'interviews', 'timeline']);

        return $this->success($this->transform($application, true));
    }

    public function update(Request $request, int $id)
    {
        $user = $this->authUser($request);
        if (!$user) {
            return $this->unauthorized();
        }

        $application = $this->findOwned($user, $id);
        if (!$application) {
            return $this->notFound('Application not found.');
        }

        $validator = Validator::make($request->all(), [
            'current_stage' => 'nullable|in:' . implode(',', HRApplication::STAGES),
            'rating' => 'nullable|integer|min:1|max:5',
            'interview_date' => 'nullable|date',
            'interview_mode' => 'nullable|string|max:100',
            'interview_link' => 'nullable|string|max:500',
            'interviewer_notes' => 'nullable|string',
            'hr_notes' => 'nullable|string',
            'offer_salary' => 'nullable|numeric|min:0',
            'offer_status' => 'nullable|in:none,pending,accepted,declined',
            'joined_date' => 'nullable|date',
            'rejected_reason' => 'nullable|string',
            'source' => 'nullable|string|max:100',
            'expected_salary' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (isset($data['current_stage'])) {
            $application->moveToStage($data['current_stage'], $user->id, $data['rejected_reason'] ?? null);
            unset($data['current_stage'], $data['rejected_reason']);
        }

        if (isset($data['offer_status']) && $data['offer_status'] === 'pending' && !$application->offer_sent_at) {
            $data['offer_sent_at'] = now();
        }

        $application->fill($data)->save();
        $application->load(['candidate', 'job', 'interviews', 'timeline']);
        $this->logActivity($user, 'updated', 'applications', "Updated application #{$application->id}");

        return $this->success($this->transform($application, true), 'Application updated.');
    }

    public function shortlist(Request $request, int $id)
    {
        return $this->moveAction($request, $id, 'screening', 'Application shortlisted.');
    }

    public function reject(Request $request, int $id)
    {
        $validator = Validator::make($request->all(), [
            'rejected_reason' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        return $this->moveAction($request, $id, 'rejected', 'Application rejected.', $request->rejected_reason);
    }

    public function bulkUpdate(Request $request)
    {
        $user = $this->authUser($request);
        if (!$user) {
            return $this->unauthorized();
        }

        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
            'current_stage' => 'nullable|in:' . implode(',', HRApplication::STAGES),
            'rating' => 'nullable|integer|min:1|max:5',
            'action' => 'nullable|in:shortlist,reject,move',
            'rejected_reason' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $jobIds = HRJob::where('hr_id', $user->id)->pluck('id');
        $applications = HRApplication::whereIn('job_id', $jobIds)->whereIn('id', $request->ids)->get();

        foreach ($applications as $application) {
            $stage = $request->current_stage;
            if ($request->action === 'shortlist') {
                $stage = 'screening';
            }
            if ($request->action === 'reject') {
                $stage = 'rejected';
            }

            if ($stage) {
                $application->moveToStage($stage, $user->id, $request->rejected_reason);
            }
            if ($request->filled('rating')) {
                $application->rating = $request->rating;
                $application->save();
            }
        }

        $this->logActivity($user, 'bulk_updated', 'applications', 'Bulk updated ' . $applications->count() . ' applications');

        return $this->success(['updated' => $applications->count()], 'Applications updated.');
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->authUser($request);
        if (!$user) {
            return $this->unauthorized();
        }

        $application = $this->findOwned($user, $id);
        if (!$application) {
            return $this->notFound('Application not found.');
        }

        if ($application->resume_path) {
            Storage::disk('public')->delete($application->resume_path);
        }

        $application->delete();
        $this->logActivity($user, 'deleted', 'applications', "Deleted application #{$id}");

        return $this->success(null, 'Application deleted.');
    }

    private function moveAction(Request $request, int $id, string $stage, string $message, ?string $reason = null)
    {
        $user = $this->authUser($request);
        if (!$user) {
            return $this->unauthorized();
        }

        $application = $this->findOwned($user, $id);
        if (!$application) {
            return $this->notFound('Application not found.');
        }

        $application->moveToStage($stage, $user->id, $reason);
        $application->load(['candidate', 'job', 'interviews', 'timeline']);
        $this->logActivity($user, $stage, 'applications', "{$message} #{$id}");

        return $this->success($this->transform($application, true), $message);
    }

    private function findOwned(User $user, int $id): ?HRApplication
    {
        $jobIds = HRJob::where('hr_id', $user->id)->pluck('id');

        return HRApplication::whereIn('job_id', $jobIds)->find($id);
    }

    private function transform(HRApplication $app, bool $detailed = false): array
    {
        $payload = [
            'id' => $app->id,
            'job_id' => $app->job_id,
            'candidate_id' => $app->candidate_id,
            'current_stage' => $app->current_stage,
            'stage_label' => HRApplication::STAGE_LABELS[$app->current_stage] ?? $app->current_stage,
            'rating' => $app->rating,
            'source' => $app->source,
            'expected_salary' => $app->expected_salary,
            'resume_url' => $app->resumeUrl(),
            'applied_at' => $app->applied_at ?? $app->created_at,
            'interview_date' => $app->interview_date,
            'interview_mode' => $app->interview_mode,
            'interview_link' => $app->interview_link,
            'interviewer_notes' => $app->interviewer_notes,
            'hr_notes' => $app->hr_notes,
            'offer_salary' => $app->offer_salary,
            'offer_status' => $app->offer_status,
            'offer_sent_at' => $app->offer_sent_at,
            'joined_date' => $app->joined_date,
            'rejected_reason' => $app->rejected_reason,
            'shortlisted_at' => $app->shortlisted_at,
            'rejected_at' => $app->rejected_at,
            'created_at' => $app->created_at,
            'updated_at' => $app->updated_at,
            'interview_status' => $app->relationLoaded('interviews')
                ? ($app->interviews->sortByDesc('scheduled_at')->first()?->status)
                : null,
            'candidate' => $app->candidate ? [
                'id' => $app->candidate->id,
                'name' => $app->candidate->name,
                'email' => $app->candidate->email,
                'mobile' => $app->candidate->mobile,
                'location' => $app->candidate->location,
                'experience' => $app->candidate->experience,
                'education' => $app->candidate->education,
                'skills' => $app->candidate->skills,
                'linkedin' => $app->candidate->linkedin,
                'github' => $app->candidate->github,
                'portfolio' => $app->candidate->portfolio,
                'profile_photo' => $this->mediaUrl($app->candidate->profile_photo),
                'resume_path' => $this->mediaUrl($app->candidate->resume_path),
                'bio' => $app->candidate->bio,
            ] : null,
            'job' => $app->job ? [
                'id' => $app->job->id,
                'title' => $app->job->title,
                'department' => $app->job->department,
                'location' => $app->job->location,
                'status' => $app->job->status,
            ] : null,
        ];

        if ($detailed) {
            $payload['interviews'] = $app->interviews ?? [];
            $payload['timeline'] = $app->timeline ?? [];
        }

        return $payload;
    }
}
