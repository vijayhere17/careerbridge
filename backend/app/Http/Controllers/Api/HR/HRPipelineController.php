<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRApplication;
use App\Models\HRJob;
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

        $jobQuery = HRJob::where('hr_id', $user->id);

        if ($jobId = $request->query('job_id')) {
            $jobQuery->where('id', $jobId);
        }

        $jobIds = $jobQuery->pluck('id');

        $applications = HRApplication::with(['candidate', 'job'])
            ->whereIn('job_id', $jobIds)
            ->latest()
            ->get();

        $columns = [];
        foreach (HRApplication::STAGES as $stage) {
            $items = $applications
                ->where('current_stage', $stage)
                ->values()
                ->map(fn (HRApplication $app) => [
                    'id' => $app->id,
                    'current_stage' => $app->current_stage,
                    'rating' => $app->rating,
                    'updated_at' => $app->updated_at,
                    'candidate' => [
                        'id' => $app->candidate?->id,
                        'name' => $app->candidate?->name,
                        'email' => $app->candidate?->email,
                        'profile_photo' => $this->mediaUrl($app->candidate?->profile_photo),
                        'experience' => $app->candidate?->experience,
                        'skills' => $app->candidate?->skills,
                    ],
                    'job' => [
                        'id' => $app->job?->id,
                        'title' => $app->job?->title,
                        'department' => $app->job?->department,
                    ],
                ]);

            $columns[$stage] = [
                'stage' => $stage,
                'label' => ucfirst($stage),
                'count' => $items->count(),
                'applications' => $items,
            ];
        }

        $jobs = HRJob::where('hr_id', $user->id)
            ->whereIn('status', ['open', 'on_hold'])
            ->orderBy('title')
            ->get(['id', 'title', 'department', 'status']);

        return $this->success([
            'columns' => $columns,
            'stages' => HRApplication::STAGES,
            'jobs' => $jobs,
            'total' => $applications->count(),
        ]);
    }

    public function move(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $validator = Validator::make($request->all(), [
            'stage' => 'required|in:' . implode(',', HRApplication::STAGES),
            'rejected_reason' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $jobIds = HRJob::where('hr_id', $user->id)->pluck('id');
        $application = HRApplication::whereIn('job_id', $jobIds)->find($id);

        if (!$application) {
            return $this->notFound('Application not found.');
        }

        $from = $application->current_stage;
        $to = $request->stage;

        $application->moveToStage($to);

        if ($to === 'rejected' && $request->filled('rejected_reason')) {
            $application->rejected_reason = $request->rejected_reason;
            $application->save();
        }

        $application->load(['candidate', 'job']);

        $this->logActivity(
            $user,
            'moved',
            'pipeline',
            "Moved application #{$application->id} from {$from} to {$to}"
        );

        return $this->success([
            'id' => $application->id,
            'from' => $from,
            'to' => $to,
            'current_stage' => $application->current_stage,
            'candidate' => [
                'id' => $application->candidate?->id,
                'name' => $application->candidate?->name,
            ],
            'job' => [
                'id' => $application->job?->id,
                'title' => $application->job?->title,
            ],
        ], 'Application moved.');
    }
}
