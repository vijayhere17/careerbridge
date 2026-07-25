<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Models\RecruiterApplication;
use App\Models\RecruiterOpportunity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RecruiterApplicationController extends RecruiterBaseController
{
    private const STATUSES = ['new', 'shortlisted', 'interview', 'rejected', 'hired'];

    public function index(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->query(), [
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|in:' . implode(',', self::STATUSES),
            'job_id' => 'nullable|integer',
            'opportunity_id' => 'nullable|integer',
            'recruiter_opportunity_id' => 'nullable|integer',
            'sort' => 'nullable|in:latest,oldest,rating,status,interview',
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

        $opportunityId = $request->query('opportunity_id', $request->query('recruiter_opportunity_id', $request->query('job_id')));
        if ($opportunityId) {
            $baseQuery->where('recruiter_opportunity_id', $opportunityId);
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
            'oldest' => $query->oldest(),
            'rating' => $query->orderByDesc('rating'),
            'status' => $query->orderBy('status'),
            'interview' => $query->orderByRaw('interview_at IS NULL, interview_at ASC'),
            default => $query->latest(),
        };

        $applications = $query->paginate(min((int) $request->query('per_page', 15), 100));
        $applications->getCollection()->transform(fn (RecruiterApplication $application) => $this->transform($application));

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

        $application = DB::transaction(function () use ($data, $opportunity) {
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

            return $application;
        });

        $application->load(['candidate', 'opportunity']);

        return $this->success($this->transform($application, true), 'Application created successfully.', 201);
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

        $application->load(['candidate', 'opportunity']);

        return $this->success($this->transform($application, true), 'Application retrieved successfully.');
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

        $application->fill($data)->save();
        $application->load(['candidate', 'opportunity']);

        return $this->success($this->transform($application, true), 'Application updated successfully.');
    }

    public function shortlist(Request $request, int $id)
    {
        return $this->statusAction($request, $id, 'shortlisted', 'Application shortlisted successfully.');
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
            $request->input('reason', $request->input('notes'))
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

        $application->forceFill([
            'status' => 'interview',
            'interview_status' => $request->input('interview_status', 'scheduled'),
            'interview_at' => $request->input('interview_at'),
            'interview_link' => $request->input('interview_link'),
            'recruiter_notes' => $request->input('notes', $application->recruiter_notes),
        ])->save();

        $application->load(['candidate', 'opportunity']);

        return $this->success($this->transform($application, true), 'Interview scheduled successfully.');
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

        foreach ($applications as $application) {
            $data = [];

            if ($request->filled('rating')) {
                $data['rating'] = $request->input('rating');
            }
            if ($request->filled('notes') || $request->filled('recruiter_notes')) {
                $data['recruiter_notes'] = $request->input('recruiter_notes', $request->input('notes'));
            }
            if ($request->filled('interview_at')) {
                $data['interview_at'] = $request->input('interview_at');
            }
            if ($request->filled('interview_link')) {
                $data['interview_link'] = $request->input('interview_link');
            }
            if ($request->filled('interview_status')) {
                $data['interview_status'] = $request->input('interview_status');
            }

            $data['status'] = match ($request->input('action')) {
                'shortlist' => 'shortlisted',
                'reject' => 'rejected',
                'schedule_interview' => 'interview',
                default => $request->input('status', $application->status),
            };

            if ($request->input('action') === 'schedule_interview') {
                $data['interview_status'] = $data['interview_status'] ?? 'scheduled';
            }

            $application->forceFill($data)->save();
        }

        return $this->success([
            'matched' => $applications->count(),
            'updated' => $applications->count(),
        ], 'Applications updated successfully.');
    }

    private function statusAction(Request $request, int $id, string $status, string $message, ?string $notes = null)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $application = $this->findOwned($user, $id);
        if (!$application) {
            return $this->notFound('Application not found.');
        }

        $application->forceFill([
            'status' => $status,
            'recruiter_notes' => $notes ?? $application->recruiter_notes,
        ])->save();
        $application->load(['candidate', 'opportunity']);

        return $this->success($this->transform($application, true), $message);
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
        ];
    }

    private function transform(RecruiterApplication $application, bool $detailed = false): array
    {
        $candidate = $application->candidate;

        return [
            'id' => $application->id,
            'recruiter_opportunity_id' => $application->recruiter_opportunity_id,
            'candidate_id' => $application->candidate_id,
            'status' => $application->status,
            'rating' => $application->rating,
            'message' => $application->message,
            'notes' => $application->recruiter_notes,
            'recruiter_notes' => $application->recruiter_notes,
            'expected_salary' => $application->expected_salary !== null ? (float) $application->expected_salary : null,
            'resume_url' => $application->resumeUrl(),
            'interview_status' => $application->interview_status,
            'interview_at' => $application->interview_at,
            'interview_link' => $application->interview_link,
            'applied_at' => $application->applied_at ?? $application->created_at,
            'created_at' => $application->created_at,
            'updated_at' => $application->updated_at,
            'candidate' => $candidate ? [
                'id' => $candidate->id,
                'name' => $candidate->name,
                'email' => $candidate->email,
                'mobile' => $candidate->mobile,
                'photo' => $this->mediaUrl($candidate->profile_photo),
                'profile_photo' => $this->mediaUrl($candidate->profile_photo),
                'skills' => $candidate->skills,
                'experience' => $candidate->experience,
                'education' => $candidate->education,
                'location' => $candidate->location,
                'resume_url' => $this->mediaUrl($candidate->resume_path),
                'linkedin' => $candidate->linkedin,
                'github' => $candidate->github,
                'portfolio' => $candidate->portfolio,
                'bio' => $candidate->bio,
            ] : null,
            'opportunity' => $application->opportunity ? [
                'id' => $application->opportunity->id,
                'title' => $application->opportunity->title,
                'company_name' => $application->opportunity->company_name,
                'location' => $application->opportunity->location,
                'status' => $application->opportunity->status,
            ] : null,
            'meta' => $detailed ? [
                'can_shortlist' => $application->status !== 'shortlisted',
                'can_reject' => $application->status !== 'rejected',
                'can_schedule_interview' => $application->status !== 'rejected',
            ] : null,
        ];
    }
}
