<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRApplication;
use App\Models\HRJob;
use App\Models\User;
use Illuminate\Http\Request;
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

        $query = HRApplication::with(['candidate', 'job'])
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

        $perPage = min((int) $request->query('per_page', 15), 50);
        $applications = $query->latest()->paginate($perPage);

        $applications->getCollection()->transform(function (HRApplication $app) {
            return $this->transform($app);
        });

        return $this->success($applications);
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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $job = HRJob::where('hr_id', $user->id)->find($request->job_id);

        if (!$job) {
            return $this->forbidden('You do not own this job.');
        }

        $exists = HRApplication::where('job_id', $job->id)
            ->where('candidate_id', $request->candidate_id)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Candidate already applied to this job.',
            ], 422);
        }

        $application = HRApplication::create([
            'job_id' => $job->id,
            'candidate_id' => $request->candidate_id,
            'current_stage' => $request->current_stage ?? 'applied',
            'rating' => $request->rating,
            'hr_notes' => $request->hr_notes,
        ]);

        $application->load(['candidate', 'job']);
        $this->logActivity($user, 'created', 'applications', "Added application #{$application->id}");

        return $this->success($this->transform($application), 'Application created.', 201);
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

        $application->load(['candidate', 'job', 'interviews']);

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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        if (isset($data['current_stage'])) {
            $application->moveToStage($data['current_stage']);
            unset($data['current_stage']);
        }

        $application->fill($data)->save();
        $application->load(['candidate', 'job']);

        $this->logActivity($user, 'updated', 'applications', "Updated application #{$application->id}");

        return $this->success($this->transform($application), 'Application updated.');
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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $jobIds = HRJob::where('hr_id', $user->id)->pluck('id');
        $applications = HRApplication::whereIn('job_id', $jobIds)
            ->whereIn('id', $request->ids)
            ->get();

        foreach ($applications as $application) {
            if ($request->filled('current_stage')) {
                $application->moveToStage($request->current_stage);
            }
            if ($request->filled('rating')) {
                $application->rating = $request->rating;
                $application->save();
            }
        }

        $this->logActivity($user, 'bulk_updated', 'applications', 'Bulk updated ' . $applications->count() . ' applications');

        return $this->success([
            'updated' => $applications->count(),
        ], 'Applications updated.');
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

        $application->delete();
        $this->logActivity($user, 'deleted', 'applications', "Deleted application #{$id}");

        return $this->success(null, 'Application deleted.');
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
            'rating' => $app->rating,
            'interview_date' => $app->interview_date,
            'interview_mode' => $app->interview_mode,
            'interview_link' => $app->interview_link,
            'interviewer_notes' => $app->interviewer_notes,
            'hr_notes' => $app->hr_notes,
            'offer_salary' => $app->offer_salary,
            'offer_status' => $app->offer_status,
            'joined_date' => $app->joined_date,
            'rejected_reason' => $app->rejected_reason,
            'created_at' => $app->created_at,
            'updated_at' => $app->updated_at,
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
        }

        return $payload;
    }
}
