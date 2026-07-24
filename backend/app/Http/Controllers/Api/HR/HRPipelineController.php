<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRApplication;
use App\Models\HRJob;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HRPipelineController extends HRBaseController
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
            'job_id' => 'nullable|integer|exists:hr_jobs,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $jobQuery = HRJob::where('hr_id', $user->id);

        if ($jobId = $request->query('job_id')) {
            $jobQuery->where('id', $jobId);
        }

        $jobIds = $jobQuery->pluck('id');

        $applications = HRApplication::with(['candidate', 'job', 'interviews'])
            ->whereIn('job_id', $jobIds)
            ->latest()
            ->get();

        $columns = collect(HRApplication::STAGES)->mapWithKeys(function (string $stage) use ($applications) {
            $items = $applications
                ->where('current_stage', $stage)
                ->values()
                ->map(fn (HRApplication $application) => $this->transformApplication($application));

            return [
                $stage => [
                    'stage' => $stage,
                    'label' => HRApplication::STAGE_LABELS[$stage] ?? $stage,
                    'count' => $items->count(),
                    'applications' => $items,
                ],
            ];
        });

        $jobs = HRJob::where('hr_id', $user->id)
            ->orderBy('title')
            ->get(['id', 'title', 'department', 'location', 'status']);

        return $this->success([
            'columns' => $columns,
            'stages' => HRApplication::STAGES,
            'stage_labels' => HRApplication::STAGE_LABELS,
            'jobs' => $jobs,
            'total' => $applications->count(),
        ], 'Pipeline retrieved successfully.');
    }

    public function move(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $validator = Validator::make($request->all(), [
            'stage' => 'required|in:' . implode(',', HRApplication::STAGES),
            'rejected_reason' => 'required_if:stage,rejected|nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $application = $this->findOwnedApplication($user, $id);

        if (!$application) {
            return $this->notFound('Application not found.');
        }

        $data = $validator->validated();
        $from = $application->current_stage;
        $to = $data['stage'];

        $application->moveToStage($to, $user->id, $data['rejected_reason'] ?? null);
        $application->load(['candidate', 'job', 'interviews']);

        $this->logActivity(
            $user,
            'moved',
            'pipeline',
            "Moved application #{$application->id} from {$from} to {$to}"
        );

        return $this->success([
            'id' => $application->id,
            'from' => $from,
            'from_label' => HRApplication::STAGE_LABELS[$from] ?? $from,
            'to' => $to,
            'to_label' => HRApplication::STAGE_LABELS[$to] ?? $to,
            'current_stage' => $application->current_stage,
            'current_stage_label' => HRApplication::STAGE_LABELS[$application->current_stage] ?? $application->current_stage,
            'application' => $this->transformApplication($application),
        ], 'Application moved.');
    }

    private function findOwnedApplication(User $user, int $id): ?HRApplication
    {
        return HRApplication::whereIn('job_id', HRJob::where('hr_id', $user->id)->pluck('id'))->find($id);
    }

    private function transformApplication(HRApplication $application): array
    {
        $latestInterview = $application->relationLoaded('interviews')
            ? $application->interviews->sortByDesc('scheduled_at')->first()
            : null;

        return [
            'id' => $application->id,
            'current_stage' => $application->current_stage,
            'stage_label' => HRApplication::STAGE_LABELS[$application->current_stage] ?? $application->current_stage,
            'rating' => $application->rating,
            'source' => $application->source,
            'expected_salary' => $application->expected_salary,
            'resume_url' => $application->resumeUrl(),
            'applied_at' => $application->applied_at ?? $application->created_at,
            'stage_changed_at' => $application->stage_changed_at,
            'rejected_reason' => $application->rejected_reason,
            'offer_status' => $application->offer_status,
            'updated_at' => $application->updated_at,
            'candidate' => [
                'id' => $application->candidate?->id,
                'name' => $application->candidate?->name,
                'email' => $application->candidate?->email,
                'mobile' => $application->candidate?->mobile,
                'location' => $application->candidate?->location,
                'profile_photo' => $this->mediaUrl($application->candidate?->profile_photo),
                'experience' => $application->candidate?->experience,
                'education' => $application->candidate?->education,
                'skills' => $application->candidate?->skills ?? [],
                'tags' => $application->candidate?->tags ?? [],
            ],
            'job' => [
                'id' => $application->job?->id,
                'title' => $application->job?->title,
                'department' => $application->job?->department,
                'location' => $application->job?->location,
                'status' => $application->job?->status,
            ],
            'latest_interview' => $latestInterview ? [
                'id' => $latestInterview->id,
                'scheduled_at' => $latestInterview->scheduled_at,
                'status' => $latestInterview->status,
                'rating' => $latestInterview->rating,
                'result' => $latestInterview->result,
            ] : null,
        ];
    }
}
