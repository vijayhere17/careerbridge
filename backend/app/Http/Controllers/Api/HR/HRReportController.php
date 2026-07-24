<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRApplication;
use App\Models\HRInterview;
use App\Models\HRJob;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class HRReportController extends HRBaseController
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
        $applications = HRApplication::whereIn('job_id', $jobIds)->get();

        $totalApps = $applications->count();
        $joined = $applications->where('current_stage', 'joined')->count();
        $rejected = $applications->where('current_stage', 'rejected')->count();
        $offers = $applications->where('current_stage', 'offer')->count();

        $conversionRates = [
            'application_to_screening' => $this->rate($totalApps, $applications->whereNotIn('current_stage', ['applied'])->count()),
            'screening_to_offer' => $this->rate(
                $applications->whereNotIn('current_stage', ['applied', 'screening', 'rejected'])->count(),
                $offers + $joined
            ),
            'offer_to_join' => $this->rate($offers + $joined, $joined),
            'overall_hire_rate' => $this->rate($totalApps, $joined),
        ];

        $departmentAnalytics = HRJob::where('hr_id', $user->id)
            ->selectRaw('department, COUNT(*) as jobs_count')
            ->groupBy('department')
            ->get()
            ->map(function ($row) use ($jobIds) {
                $deptJobIds = HRJob::whereIn('id', $jobIds)
                    ->where('department', $row->department)
                    ->pluck('id');

                $apps = HRApplication::whereIn('job_id', $deptJobIds)->get();

                return [
                    'department' => $row->department ?: 'Unassigned',
                    'jobs' => (int) $row->jobs_count,
                    'applications' => $apps->count(),
                    'hired' => $apps->where('current_stage', 'joined')->count(),
                    'rejected' => $apps->where('current_stage', 'rejected')->count(),
                ];
            });

        $topJobs = HRJob::where('hr_id', $user->id)
            ->withCount('applications')
            ->orderByDesc('applications_count')
            ->limit(5)
            ->get()
            ->map(fn (HRJob $job) => [
                'id' => $job->id,
                'title' => $job->title,
                'department' => $job->department,
                'status' => $job->status,
                'applications_count' => $job->applications_count,
                'hired' => HRApplication::where('job_id', $job->id)->where('current_stage', 'joined')->count(),
            ]);

        $timeToHireDays = [];
        foreach ($applications->where('current_stage', 'joined') as $app) {
            if ($app->joined_date && $app->created_at) {
                $timeToHireDays[] = $app->created_at->diffInDays(Carbon::parse($app->joined_date));
            }
        }

        $avgTimeToHire = count($timeToHireDays)
            ? round(array_sum($timeToHireDays) / count($timeToHireDays), 1)
            : 0;

        $monthly = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthly[] = [
                'month' => $month->format('M Y'),
                'applications' => HRApplication::whereIn('job_id', $jobIds)
                    ->whereMonth('created_at', $month->month)
                    ->whereYear('created_at', $month->year)
                    ->count(),
                'hired' => HRApplication::whereIn('job_id', $jobIds)
                    ->where('current_stage', 'joined')
                    ->whereMonth('joined_date', $month->month)
                    ->whereYear('joined_date', $month->year)
                    ->count(),
                'interviews' => HRInterview::where('hr_id', $user->id)
                    ->whereMonth('scheduled_at', $month->month)
                    ->whereYear('scheduled_at', $month->year)
                    ->count(),
            ];
        }

        $funnel = [];
        foreach (HRApplication::STAGES as $stage) {
            $funnel[] = [
                'stage' => $stage,
                'label' => ucfirst($stage),
                'count' => $applications->where('current_stage', $stage)->count(),
            ];
        }

        return $this->success([
            'summary' => [
                'total_jobs' => HRJob::where('hr_id', $user->id)->count(),
                'open_jobs' => HRJob::where('hr_id', $user->id)->where('status', 'open')->count(),
                'total_applications' => $totalApps,
                'hired' => $joined,
                'rejected' => $rejected,
                'offers_pending' => $offers,
                'avg_time_to_hire_days' => $avgTimeToHire,
                'interviews_completed' => HRInterview::where('hr_id', $user->id)->where('status', 'completed')->count(),
            ],
            'conversion_rates' => $conversionRates,
            'department_analytics' => $departmentAnalytics,
            'top_jobs' => $topJobs,
            'funnel' => $funnel,
            'monthly_reports' => $monthly,
        ]);
    }

    private function rate(int $from, int $to): float
    {
        if ($from <= 0) {
            return 0;
        }

        return round(($to / $from) * 100, 1);
    }
}
