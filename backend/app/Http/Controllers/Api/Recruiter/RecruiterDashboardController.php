<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Models\Notification;
use App\Models\RecruiterApplication;
use App\Models\RecruiterContactUnlock;
use App\Models\RecruiterOpportunity;
use App\Models\Wallet;
use App\Models\WithdrawRequest;
use App\Services\RecruiterOnboardingService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class RecruiterDashboardController extends RecruiterBaseController
{
    public function index(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $opportunityIds = RecruiterOpportunity::where('user_id', $user->id)->pluck('id');
        $opportunities = RecruiterOpportunity::where('user_id', $user->id);
        $applications = RecruiterApplication::whereIn('recruiter_opportunity_id', $opportunityIds);
        $earnedUnlocks = RecruiterContactUnlock::where('recruiter_id', $user->id)->where('status', 'earned');
        $pendingUnlocks = RecruiterContactUnlock::where('recruiter_id', $user->id)->where('status', 'pending');
        $wallet = Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0]);

        $totalApplications = (clone $applications)->count();
        $actedApplications = (clone $applications)
            ->whereIn('status', ['shortlisted', 'interview', 'rejected', 'hired'])
            ->count();
        $interviewInvitations = (clone $applications)->where('status', 'interview')->count();
        $upcomingInterviews = (clone $applications)
            ->with(['candidate', 'opportunity'])
            ->whereNotNull('interview_at')
            ->where('interview_at', '>=', now())
            ->orderBy('interview_at')
            ->limit(8)
            ->get()
            ->map(fn (RecruiterApplication $application) => $this->applicationPayload($application, true));

        $onboarding = app(RecruiterOnboardingService::class)->statusPayload($user);
        $profile = $onboarding['profile'] ?? null;

        $recentApplications = (clone $applications)
            ->with(['candidate', 'opportunity'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (RecruiterApplication $application) => $this->applicationPayload($application));

        $recentPosts = (clone $opportunities)
            ->withCount(['applications', 'unlocks'])
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (RecruiterOpportunity $opportunity) => $this->opportunityPayload($opportunity));

        $recentEarnings = (clone $earnedUnlocks)
            ->with(['candidate', 'opportunity'])
            ->latest('unlocked_at')
            ->limit(6)
            ->get()
            ->map(fn (RecruiterContactUnlock $unlock) => $this->unlockPayload($unlock));

        $recentUnlocks = RecruiterContactUnlock::where('recruiter_id', $user->id)
            ->with(['candidate', 'opportunity'])
            ->latest('unlocked_at')
            ->limit(6)
            ->get()
            ->map(fn (RecruiterContactUnlock $unlock) => $this->unlockPayload($unlock));

        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Notification $notification) => $this->notificationPayload($notification));

        $mostViewed = (clone $opportunities)
            ->withCount(['applications', 'unlocks'])
            ->orderByDesc('views')
            ->orderByDesc('id')
            ->first();

        $topPerforming = (clone $opportunities)
            ->withCount(['applications', 'unlocks'])
            ->orderByDesc('applications_count')
            ->orderByDesc('views')
            ->limit(5)
            ->get()
            ->map(fn (RecruiterOpportunity $opportunity) => $this->opportunityPayload($opportunity));

        $monthlyEarnings = (float) (clone $earnedUnlocks)
            ->whereMonth('unlocked_at', now()->month)
            ->whereYear('unlocked_at', now()->year)
            ->sum('amount');

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'company' => $user->company,
                'current_role' => $user->current_role,
                'profile_photo' => $this->mediaUrl($user->profile_photo),
            ],
            'profile_status' => [
                'company_name' => $profile['company_name'] ?? $user->company,
                'recruiter_name' => $profile['recruiter_name'] ?? $user->name,
                'recruiter_type' => $profile['recruiter_type'] ?? null,
                'approval_status' => $profile['approval_status'] ?? null,
                'profile_completion' => (int) ($profile['profile_completion'] ?? $onboarding['profile_completion'] ?? 0),
                'company_logo' => $profile['company_logo'] ?? null,
                'industry' => $profile['industry'] ?? null,
                'can_access_dashboard' => (bool) ($onboarding['can_access_dashboard'] ?? false),
            ],
            'stats' => [
                'total_opportunities' => (clone $opportunities)->count(),
                'published_opportunities' => (clone $opportunities)->where('status', 'published')->count(),
                'draft_opportunities' => (clone $opportunities)->where('status', 'draft')->count(),
                'closed_opportunities' => (clone $opportunities)->where('status', 'closed')->count(),
                'archived_opportunities' => (clone $opportunities)->where('status', 'archived')->count(),
                'paused_opportunities' => (clone $opportunities)->where('status', 'paused')->count(),
                'open_positions' => (clone $opportunities)->whereIn('status', ['published', 'paused'])->count(),
                'applications' => $totalApplications,
                'today_applications' => (clone $applications)->whereDate('created_at', Carbon::today())->count(),
                'views' => (int) (clone $opportunities)->sum('views'),
                'profile_completion' => (int) ($profile['profile_completion'] ?? $onboarding['profile_completion'] ?? 0),
                'unlock_earnings' => [
                    'today' => (float) (clone $earnedUnlocks)->whereDate('unlocked_at', Carbon::today())->sum('amount'),
                    'month' => $monthlyEarnings,
                    'lifetime' => (float) (clone $earnedUnlocks)->sum('amount'),
                    'pending' => (float) (clone $pendingUnlocks)->sum('amount'),
                ],
                'contact_unlock_earnings' => (float) (clone $earnedUnlocks)->sum('amount'),
                'wallet_balance' => (float) $wallet->balance,
                'pending_withdrawals' => (float) WithdrawRequest::where('user_id', $user->id)
                    ->where('status', 'pending')
                    ->sum('amount'),
                'monthly_earnings' => $monthlyEarnings,
                'response_rate' => $totalApplications > 0
                    ? round(($actedApplications / $totalApplications) * 100, 1)
                    : 0,
                'interview_invitations' => $interviewInvitations,
                'hired_applications' => (clone $applications)->where('status', 'hired')->count(),
                'pipeline' => [
                    'new' => (clone $applications)->where('status', 'new')->count(),
                    'under_review' => (clone $applications)->where('status', 'under_review')->count(),
                    'shortlisted' => (clone $applications)->where('status', 'shortlisted')->count(),
                    'interview' => $interviewInvitations,
                    'interview_completed' => (clone $applications)->where('status', 'interview_completed')->count(),
                    'accepted' => (clone $applications)->where('status', 'accepted')->count(),
                    'rejected' => (clone $applications)->where('status', 'rejected')->count(),
                    'withdrawn' => (clone $applications)->where('status', 'withdrawn')->count(),
                    'hired' => (clone $applications)->where('status', 'hired')->count(),
                    'completed' => (clone $applications)->where('status', 'completed')->count(),
                ],
                'conversion' => [
                    'interview_rate' => $totalApplications > 0
                        ? round((((clone $applications)->whereIn('status', ['interview', 'interview_completed', 'accepted', 'hired', 'completed'])->count()) / $totalApplications) * 100, 1)
                        : 0,
                    'hiring_rate' => $totalApplications > 0
                        ? round((((clone $applications)->whereIn('status', ['hired', 'completed'])->count()) / $totalApplications) * 100, 1)
                        : 0,
                    'contact_unlock_count' => (clone $earnedUnlocks)->count(),
                ],
            ],
            'application_trends' => $this->applicationTrends($opportunityIds),
            'opportunity_performance' => $topPerforming,
            'most_viewed_opportunity' => $mostViewed ? $this->opportunityPayload($mostViewed) : null,
            'recent_applications' => $recentApplications,
            'recent_posts' => $recentPosts,
            'recent_opportunities' => $recentPosts,
            'recent_earnings' => $recentEarnings,
            'recent_candidate_unlocks' => $recentUnlocks,
            'upcoming_interviews' => $upcomingInterviews,
            'notifications' => $notifications,
            'unread_notifications' => Notification::where('user_id', $user->id)->where('is_read', false)->count(),
            'recent_activity' => $this->recentActivity($recentApplications, $recentPosts, $recentEarnings),
            'quick_actions' => [
                ['label' => 'Post Opportunity', 'path' => '/recruiter/post-new'],
                ['label' => 'Review Applications', 'path' => '/recruiter/applications'],
                ['label' => 'Unlock History', 'path' => '/recruiter/unlock-earnings'],
                ['label' => 'Withdraw Earnings', 'path' => '/recruiter/withdraw'],
            ],
        ], 'Dashboard retrieved successfully.');
    }

    private function applicationTrends($opportunityIds): array
    {
        $days = collect(range(6, 0))->map(function (int $offset) use ($opportunityIds) {
            $date = Carbon::today()->subDays($offset);

            return [
                'date' => $date->toDateString(),
                'label' => $date->format('D'),
                'applications' => RecruiterApplication::whereIn('recruiter_opportunity_id', $opportunityIds)
                    ->whereDate('created_at', $date)
                    ->count(),
                'views' => 0,
            ];
        });

        return [
            'days' => 7,
            'chart' => $days->values()->all(),
        ];
    }

    private function recentActivity($applications, $posts, $unlocks)
    {
        return collect()
            ->merge($applications->map(fn ($application) => [
                'type' => 'application',
                'title' => 'New application received',
                'description' => trim(($application['candidate']['name'] ?? 'Candidate') . ' applied for ' . ($application['opportunity']['title'] ?? 'an opportunity')),
                'created_at' => $application['created_at'],
            ]))
            ->merge($posts->map(fn ($post) => [
                'type' => 'opportunity',
                'title' => 'Opportunity updated',
                'description' => $post['title'],
                'created_at' => $post['updated_at'] ?? $post['created_at'],
            ]))
            ->merge($unlocks->map(fn ($unlock) => [
                'type' => 'unlock',
                'title' => 'Contact unlock earning',
                'description' => ($unlock['candidate']['name'] ?? 'Candidate') . ' on ' . ($unlock['opportunity']['title'] ?? 'opportunity'),
                'amount' => $unlock['amount'],
                'created_at' => $unlock['unlocked_at'] ?? $unlock['created_at'],
            ]))
            ->sortByDesc('created_at')
            ->take(10)
            ->values();
    }

    private function applicationPayload(RecruiterApplication $application, bool $includeInterview = false): array
    {
        $payload = [
            'id' => $application->id,
            'status' => $application->status,
            'rating' => $application->rating,
            'interview_status' => $application->interview_status,
            'interview_at' => $application->interview_at,
            'interview_link' => $application->interview_link,
            'expected_salary' => $application->expected_salary,
            'applied_at' => $application->applied_at ?? $application->created_at,
            'created_at' => $application->created_at,
            'candidate' => $application->candidate ? [
                'id' => $application->candidate->id,
                'name' => $application->candidate->name,
                'email' => $application->candidate->email,
                'mobile' => $application->candidate->mobile,
                'location' => $application->candidate->location,
                'experience' => $application->candidate->experience,
                'skills' => $application->candidate->skills,
                'profile_photo' => $this->mediaUrl($application->candidate->profile_photo),
                'photo' => $this->mediaUrl($application->candidate->profile_photo),
            ] : null,
            'opportunity' => $application->opportunity ? [
                'id' => $application->opportunity->id,
                'title' => $application->opportunity->title,
                'status' => $application->opportunity->status,
            ] : null,
        ];

        if ($includeInterview) {
            $payload['interview_at'] = $application->interview_at;
            $payload['interview_link'] = $application->interview_link;
        }

        return $payload;
    }

    private function opportunityPayload(RecruiterOpportunity $opportunity): array
    {
        return [
            'id' => $opportunity->id,
            'title' => $opportunity->title,
            'company_name' => $opportunity->company_name,
            'status' => $opportunity->status,
            'location' => $opportunity->location,
            'views' => (int) $opportunity->views,
            'applications_count' => (int) ($opportunity->applications_count ?? 0),
            'unlocks_count' => (int) ($opportunity->unlocks_count ?? 0),
            'created_at' => $opportunity->created_at,
            'updated_at' => $opportunity->updated_at,
        ];
    }

    private function unlockPayload(RecruiterContactUnlock $unlock): array
    {
        return [
            'id' => $unlock->id,
            'amount' => (float) $unlock->amount,
            'status' => $unlock->status,
            'unlocked_at' => $unlock->unlocked_at,
            'created_at' => $unlock->created_at,
            'candidate' => $unlock->candidate ? [
                'id' => $unlock->candidate->id,
                'name' => $unlock->candidate->name,
                'profile_photo' => $this->mediaUrl($unlock->candidate->profile_photo),
            ] : null,
            'opportunity' => $unlock->opportunity ? [
                'id' => $unlock->opportunity->id,
                'title' => $unlock->opportunity->title,
            ] : null,
        ];
    }

    private function notificationPayload(Notification $notification): array
    {
        return [
            'id' => $notification->id,
            'title' => $notification->title,
            'message' => $notification->message,
            'type' => $notification->type,
            'is_read' => (bool) $notification->is_read,
            'read' => (bool) $notification->is_read,
            'data' => $notification->data,
            'created_at' => $notification->created_at,
        ];
    }
}
