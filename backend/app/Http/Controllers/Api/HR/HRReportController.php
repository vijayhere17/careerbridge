<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRApplication;
use App\Models\HRInterview;
use App\Models\HRJob;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;

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

        $validator = Validator::make($request->query(), [
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $jobs = HRJob::where('hr_id', $user->id)->withCount('applications')->get();
        $jobIds = $jobs->pluck('id');

        $applicationQuery = HRApplication::with('job')->whereIn('job_id', $jobIds);

        if ($from = $request->query('from')) {
            $applicationQuery->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $applicationQuery->whereDate('created_at', '<=', $to);
        }

        $applications = $applicationQuery->get();
        $allApplications = HRApplication::with('job')->whereIn('job_id', $jobIds)->get();

        $interviewQuery = HRInterview::where('hr_id', $user->id)
            ->whereIn('application_id', $allApplications->pluck('id'));

        if ($from = $request->query('from')) {
            $interviewQuery->whereDate('scheduled_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $interviewQuery->whereDate('scheduled_at', '<=', $to);
        }

        $interviews = $interviewQuery->get();

        $totalApplications = $applications->count();
        $joined = $applications->where('current_stage', 'joined')->count();
        $rejected = $applications->where('current_stage', 'rejected')->count();
        $offers = $applications->where('current_stage', 'offer')->count();
        $acceptedOffers = $applications->where('offer_status', 'accepted')->count();
        $declinedOffers = $applications->where('offer_status', 'declined')->count();
        $decidedOffers = $acceptedOffers + $declinedOffers;
        $completedInterviews = $interviews->where('status', 'completed')->count();
        $scheduledInterviewTotal = $interviews->count();

        $conversionRates = [
            'application_to_screening' => $this->rate(
                $totalApplications,
                $applications->whereNotIn('current_stage', ['applied'])->count()
            ),
            'screening_to_offer' => $this->rate(
                $applications->whereNotIn('current_stage', ['applied', 'rejected'])->count(),
                $applications->whereIn('current_stage', ['offer', 'joined'])->count()
            ),
            'offer_to_join' => $this->rate($applications->whereIn('current_stage', ['offer', 'joined'])->count(), $joined),
            'overall_hire_rate' => $this->rate($totalApplications, $joined),
            'offer_acceptance_ratio' => $this->rate($decidedOffers, $acceptedOffers),
            'interview_conversion' => $this->rate($scheduledInterviewTotal, $completedInterviews),
        ];

        $departmentAnalytics = $jobs
            ->groupBy(fn (HRJob $job) => $job->department ?: 'Unassigned')
            ->map(function ($departmentJobs, $department) use ($applications) {
                $departmentJobIds = $departmentJobs->pluck('id');
                $departmentApplications = $applications->whereIn('job_id', $departmentJobIds);

                return [
                    'department' => $department,
                    'jobs' => $departmentJobs->count(),
                    'applications' => $departmentApplications->count(),
                    'hired' => $departmentApplications->where('current_stage', 'joined')->count(),
                    'rejected' => $departmentApplications->where('current_stage', 'rejected')->count(),
                    'open_jobs' => $departmentJobs->where('status', 'open')->count(),
                    'hire_rate' => $this->rate(
                        $departmentApplications->count(),
                        $departmentApplications->where('current_stage', 'joined')->count()
                    ),
                ];
            })
            ->values();

        $topDepartments = $departmentAnalytics
            ->sortByDesc('applications')
            ->values()
            ->take(10)
            ->map(function (array $department, int $index) {
                return array_merge(['rank' => $index + 1], $department);
            })
            ->values();

        $topJobs = $jobs
            ->sortByDesc('applications_count')
            ->take(5)
            ->values()
            ->map(function (HRJob $job) use ($applications) {
                $jobApplications = $applications->where('job_id', $job->id);

                return [
                    'id' => $job->id,
                    'title' => $job->title,
                    'department' => $job->department,
                    'location' => $job->location,
                    'status' => $job->status,
                    'applications_count' => (int) $job->applications_count,
                    'hired' => $jobApplications->where('current_stage', 'joined')->count(),
                    'rejected' => $jobApplications->where('current_stage', 'rejected')->count(),
                    'hire_rate' => $this->rate(
                        $jobApplications->count(),
                        $jobApplications->where('current_stage', 'joined')->count()
                    ),
                ];
            });

        $avgTimeToHire = $this->averageTimeToHire($applications);

        $monthly = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthlyApplications = $allApplications->filter(
                fn (HRApplication $application) => $application->created_at
                    && $application->created_at->month === $month->month
                    && $application->created_at->year === $month->year
            );
            $monthlyHired = $allApplications->filter(
                fn (HRApplication $application) => $application->joined_date
                    && Carbon::parse($application->joined_date)->month === $month->month
                    && Carbon::parse($application->joined_date)->year === $month->year
            );
            $monthlyInterviews = HRInterview::where('hr_id', $user->id)
                ->whereMonth('scheduled_at', $month->month)
                ->whereYear('scheduled_at', $month->year)
                ->count();

            $monthly[] = [
                'month' => $month->format('M Y'),
                'applications' => $monthlyApplications->count(),
                'hired' => $monthlyHired->count(),
                'interviews' => $monthlyInterviews,
            ];
        }

        $funnel = collect(HRApplication::STAGES)->map(fn (string $stage) => [
            'stage' => $stage,
            'label' => HRApplication::STAGE_LABELS[$stage] ?? $stage,
            'count' => $applications->where('current_stage', $stage)->count(),
        ])->values();

        $sources = $applications
            ->groupBy(fn (HRApplication $application) => $application->source ?: 'Unknown')
            ->map(fn ($items, $source) => [
                'source' => $source,
                'count' => $items->count(),
                'percentage' => $this->rate($totalApplications, $items->count()),
            ])
            ->sortByDesc('count')
            ->values();

        return $this->success([
            'summary' => [
                'total_jobs' => $jobs->count(),
                'open_jobs' => $jobs->where('status', 'open')->count(),
                'total_applications' => $totalApplications,
                'hired' => $joined,
                'rejected' => $rejected,
                'offers_pending' => $offers,
                'avg_time_to_hire_days' => $avgTimeToHire,
                'interviews_completed' => $completedInterviews,
                'interviews_scheduled_total' => $scheduledInterviewTotal,
            ],
            'conversion_rates' => $conversionRates,
            'department_analytics' => $departmentAnalytics,
            'top_departments' => $topDepartments,
            'top_jobs' => $topJobs,
            'top_recruiters' => [],
            'funnel' => $funnel,
            'monthly_reports' => $monthly,
            'sources' => $sources,
            'offer_acceptance_ratio' => [
                'accepted' => $acceptedOffers,
                'declined' => $declinedOffers,
                'total_decided' => $decidedOffers,
                'ratio' => $conversionRates['offer_acceptance_ratio'],
            ],
            'interview_conversion' => [
                'completed' => $completedInterviews,
                'scheduled_total' => $scheduledInterviewTotal,
                'ratio' => $conversionRates['interview_conversion'],
            ],
            'date_range' => [
                'from' => $request->query('from'),
                'to' => $request->query('to'),
            ],
        ], 'Reports retrieved successfully.');
    }

    private function averageTimeToHire($applications): float
    {
        $timeToHireDays = [];

        foreach ($applications->where('current_stage', 'joined') as $application) {
            if (!$application->joined_date) {
                continue;
            }

            $startedAt = $application->applied_at ?? $application->created_at;

            if (!$startedAt) {
                continue;
            }

            $timeToHireDays[] = Carbon::parse($startedAt)->diffInDays(Carbon::parse($application->joined_date));
        }

        return count($timeToHireDays)
            ? round(array_sum($timeToHireDays) / count($timeToHireDays), 1)
            : 0.0;
    }

    private function rate(int $from, int $to): float
    {
        if ($from <= 0) {
            return 0.0;
        }

        return round(($to / $from) * 100, 1);
    }
}
