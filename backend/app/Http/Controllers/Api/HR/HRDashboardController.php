<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRActivityLog;
use App\Models\HRApplication;
use App\Models\HRInterview;
use App\Models\HRJob;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class HRDashboardController extends HRBaseController
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

        $profile = $user->hrProfile;
        $jobIds = HRJob::where('hr_id', $user->id)->pluck('id');

        $openJobs = HRJob::where('hr_id', $user->id)->where('status', 'open')->count();
        $totalApplications = HRApplication::whereIn('job_id', $jobIds)->count();
        $pendingReviews = HRApplication::whereIn('job_id', $jobIds)
            ->whereIn('current_stage', ['applied', 'screening'])
            ->count();
        $offersPending = HRApplication::whereIn('job_id', $jobIds)
            ->where('current_stage', 'offer')
            ->count();
        $joinedCount = HRApplication::whereIn('job_id', $jobIds)
            ->where('current_stage', 'joined')
            ->count();

        $todayInterviews = HRInterview::with(['application.candidate', 'application.job'])
            ->where('hr_id', $user->id)
            ->whereDate('scheduled_at', Carbon::today())
            ->where('status', 'scheduled')
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn (HRInterview $interview) => $this->interviewPayload($interview));

        $funnel = [];
        foreach (HRApplication::STAGES as $stage) {
            $funnel[$stage] = HRApplication::whereIn('job_id', $jobIds)
                ->where('current_stage', $stage)
                ->count();
        }

        $recentApplications = HRApplication::with(['candidate', 'job'])
            ->whereIn('job_id', $jobIds)
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (HRApplication $app) => [
                'id' => $app->id,
                'candidate' => [
                    'id' => $app->candidate?->id,
                    'name' => $app->candidate?->name,
                    'email' => $app->candidate?->email,
                    'profile_photo' => $this->mediaUrl($app->candidate?->profile_photo),
                ],
                'job' => [
                    'id' => $app->job?->id,
                    'title' => $app->job?->title,
                    'department' => $app->job?->department,
                ],
                'current_stage' => $app->current_stage,
                'rating' => $app->rating,
                'created_at' => $app->created_at,
            ]);

        $recentActivity = HRActivityLog::where('hr_id', $user->id)
            ->latest()
            ->limit(10)
            ->get();

        $monthlyHires = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthlyHires[] = [
                'month' => $month->format('M'),
                'hires' => HRApplication::whereIn('job_id', $jobIds)
                    ->where('current_stage', 'joined')
                    ->whereMonth('joined_date', $month->month)
                    ->whereYear('joined_date', $month->year)
                    ->count(),
                'applications' => HRApplication::whereIn('job_id', $jobIds)
                    ->whereMonth('created_at', $month->month)
                    ->whereYear('created_at', $month->year)
                    ->count(),
            ];
        }

        return $this->success([
            'profile' => $profile ? [
                'company_name' => $profile->company_name,
                'designation' => $profile->designation,
                'department' => $profile->department,
                'company_logo' => $profile->logoUrl(),
                'verified' => (bool) $profile->verified,
                'office_location' => $profile->office_location,
            ] : null,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile_photo' => $this->mediaUrl($user->profile_photo),
            ],
            'stats' => [
                'open_jobs' => $openJobs,
                'total_applications' => $totalApplications,
                'pending_reviews' => $pendingReviews,
                'offers_pending' => $offersPending,
                'joined' => $joinedCount,
                'today_interviews' => $todayInterviews->count(),
            ],
            'funnel' => $funnel,
            'today_interviews' => $todayInterviews,
            'recent_applications' => $recentApplications,
            'recent_activity' => $recentActivity,
            'monthly_hires' => $monthlyHires,
            'quick_actions' => [
                ['label' => 'Create Job', 'path' => '/hr/jobs/create'],
                ['label' => 'View Pipeline', 'path' => '/hr/pipeline'],
                ['label' => 'Schedule Interview', 'path' => '/hr/interviews'],
                ['label' => 'View Reports', 'path' => '/hr/reports'],
            ],
        ]);
    }

    private function interviewPayload(HRInterview $interview): array
    {
        return [
            'id' => $interview->id,
            'scheduled_at' => $interview->scheduled_at,
            'duration' => $interview->duration,
            'interview_type' => $interview->interview_type,
            'meeting_link' => $interview->meeting_link,
            'interviewer_name' => $interview->interviewer_name,
            'status' => $interview->status,
            'candidate' => [
                'id' => $interview->application?->candidate?->id,
                'name' => $interview->application?->candidate?->name,
            ],
            'job' => [
                'id' => $interview->application?->job?->id,
                'title' => $interview->application?->job?->title,
            ],
        ];
    }
}
