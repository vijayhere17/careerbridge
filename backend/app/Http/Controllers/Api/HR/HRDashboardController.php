<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRActivityLog;
use App\Models\HRApplication;
use App\Models\HRInterview;
use App\Models\HRJob;
use App\Models\Notification;
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
        $jobsQuery = HRJob::where('hr_id', $user->id);

        $openJobs = (clone $jobsQuery)->where('status', 'open')->count();
        $closedJobs = (clone $jobsQuery)->where('status', 'closed')->count();
        $draftJobs = (clone $jobsQuery)->where('status', 'draft')->count();
        $archivedJobs = (clone $jobsQuery)->where('status', 'archived')->count();
        $activeJobs = $openJobs + (clone $jobsQuery)->where('status', 'on_hold')->count();

        $appsQuery = HRApplication::whereIn('job_id', $jobIds);
        $totalApplications = (clone $appsQuery)->count();
        $todayApplications = (clone $appsQuery)->whereDate('created_at', Carbon::today())->count();
        $pendingReviews = (clone $appsQuery)->whereIn('current_stage', ['applied', 'screening'])->count();
        $offersSent = (clone $appsQuery)->where(function ($q) {
            $q->where('current_stage', 'offer')->orWhereNotNull('offer_sent_at');
        })->count();
        $hiredCount = (clone $appsQuery)->where('current_stage', 'joined')->count();
        $rejectedCount = (clone $appsQuery)->where('current_stage', 'rejected')->count();

        $todayInterviews = HRInterview::with(['application.candidate', 'application.job'])
            ->where('hr_id', $user->id)
            ->whereDate('scheduled_at', Carbon::today())
            ->where('status', 'scheduled')
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn (HRInterview $interview) => $this->interviewPayload($interview));

        $weekInterviews = HRInterview::where('hr_id', $user->id)
            ->whereBetween('scheduled_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
            ->where('status', 'scheduled')
            ->count();

        $upcomingInterviews = HRInterview::with(['application.candidate', 'application.job'])
            ->where('hr_id', $user->id)
            ->where('status', 'scheduled')
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at')
            ->limit(8)
            ->get()
            ->map(fn (HRInterview $interview) => $this->interviewPayload($interview));

        $funnel = [];
        foreach (HRApplication::STAGES as $stage) {
            $funnel[$stage] = (clone $appsQuery)->where('current_stage', $stage)->count();
        }

        $hireDays = [];
        foreach ((clone $appsQuery)->where('current_stage', 'joined')->whereNotNull('joined_date')->get() as $app) {
            $start = $app->applied_at ?? $app->created_at;
            if ($start) {
                $hireDays[] = $start->diffInDays(Carbon::parse($app->joined_date));
            }
        }
        $avgHiringTime = count($hireDays) ? round(array_sum($hireDays) / count($hireDays), 1) : 0;

        $recentApplications = (clone $appsQuery)
            ->with(['candidate', 'job'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (HRApplication $app) => $this->applicationPayload($app));

        $recentHires = (clone $appsQuery)
            ->with(['candidate', 'job'])
            ->where('current_stage', 'joined')
            ->latest('joined_date')
            ->limit(6)
            ->get()
            ->map(fn (HRApplication $app) => $this->applicationPayload($app));

        $recentJobs = HRJob::where('hr_id', $user->id)
            ->withCount('applications')
            ->latest()
            ->limit(6)
            ->get();

        $recentActivity = HRActivityLog::where('hr_id', $user->id)
            ->latest()
            ->limit(10)
            ->get();

        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get();

        $unreadNotifications = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

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
                'active_jobs' => $activeJobs,
                'open_jobs' => $openJobs,
                'closed_jobs' => $closedJobs,
                'draft_jobs' => $draftJobs,
                'archived_jobs' => $archivedJobs,
                'total_applications' => $totalApplications,
                'today_applications' => $todayApplications,
                'pending_reviews' => $pendingReviews,
                'today_interviews' => $todayInterviews->count(),
                'week_interviews' => $weekInterviews,
                'offers_sent' => $offersSent,
                'offers_pending' => $funnel['offer'] ?? 0,
                'hired' => $hiredCount,
                'joined' => $hiredCount,
                'rejected' => $rejectedCount,
                'avg_hiring_time_days' => $avgHiringTime,
            ],
            'pipeline_counts' => $funnel,
            'funnel' => $funnel,
            'today_interviews' => $todayInterviews,
            'upcoming_interviews' => $upcomingInterviews,
            'recent_applications' => $recentApplications,
            'recent_hires' => $recentHires,
            'recent_jobs' => $recentJobs,
            'recent_activity' => $recentActivity,
            'notifications' => $notifications,
            'unread_notifications' => $unreadNotifications,
            'monthly_hires' => $monthlyHires,
            'quick_actions' => [
                ['label' => 'Create Job', 'path' => '/hr/jobs/create'],
                ['label' => 'View Pipeline', 'path' => '/hr/pipeline'],
                ['label' => 'Schedule Interview', 'path' => '/hr/interviews'],
                ['label' => 'View Reports', 'path' => '/hr/reports'],
            ],
            'stage_labels' => HRApplication::STAGE_LABELS,
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
            'panel' => $interview->panel,
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

    private function applicationPayload(HRApplication $app): array
    {
        return [
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
            'joined_date' => $app->joined_date,
            'created_at' => $app->created_at,
        ];
    }
}
