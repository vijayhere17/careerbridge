<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Models\Notification;
use App\Models\RecruiterApplication;
use App\Models\RecruiterContactUnlock;
use App\Models\RecruiterOpportunity;
use App\Models\Wallet;
use App\Models\WithdrawRequest;
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
        $wallet = Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0]);

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

        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->limit(6)
            ->get();

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'company' => $user->company,
                'current_role' => $user->current_role,
                'profile_photo' => $this->mediaUrl($user->profile_photo),
            ],
            'stats' => [
                'total_opportunities' => (clone $opportunities)->count(),
                'published_opportunities' => (clone $opportunities)->where('status', 'published')->count(),
                'draft_opportunities' => (clone $opportunities)->where('status', 'draft')->count(),
                'closed_opportunities' => (clone $opportunities)->where('status', 'closed')->count(),
                'archived_opportunities' => (clone $opportunities)->where('status', 'archived')->count(),
                'paused_opportunities' => (clone $opportunities)->where('status', 'paused')->count(),
                'applications' => (clone $applications)->count(),
                'today_applications' => (clone $applications)->whereDate('created_at', Carbon::today())->count(),
                'views' => (int) (clone $opportunities)->sum('views'),
                'unlock_earnings' => [
                    'today' => (float) (clone $earnedUnlocks)->whereDate('unlocked_at', Carbon::today())->sum('amount'),
                    'month' => (float) (clone $earnedUnlocks)
                        ->whereMonth('unlocked_at', now()->month)
                        ->whereYear('unlocked_at', now()->year)
                        ->sum('amount'),
                    'lifetime' => (float) (clone $earnedUnlocks)->sum('amount'),
                ],
                'wallet_balance' => (float) $wallet->balance,
                'pending_withdrawals' => (float) WithdrawRequest::where('user_id', $user->id)
                    ->where('status', 'pending')
                    ->sum('amount'),
            ],
            'recent_applications' => $recentApplications,
            'recent_posts' => $recentPosts,
            'recent_earnings' => $recentEarnings,
            'notifications' => $notifications,
            'unread_notifications' => Notification::where('user_id', $user->id)->where('is_read', false)->count(),
            'recent_activity' => $this->recentActivity($recentApplications, $recentPosts, $recentEarnings),
            'quick_actions' => [
                ['label' => 'Post Opportunity', 'path' => '/recruiter/opportunities/create'],
                ['label' => 'Review Applications', 'path' => '/recruiter/applications'],
                ['label' => 'Unlock History', 'path' => '/recruiter/unlocks'],
                ['label' => 'Withdraw Earnings', 'path' => '/recruiter/withdraw'],
            ],
        ], 'Dashboard retrieved successfully.');
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

    private function applicationPayload(RecruiterApplication $application): array
    {
        return [
            'id' => $application->id,
            'status' => $application->status,
            'rating' => $application->rating,
            'applied_at' => $application->applied_at ?? $application->created_at,
            'created_at' => $application->created_at,
            'candidate' => $application->candidate ? [
                'id' => $application->candidate->id,
                'name' => $application->candidate->name,
                'email' => $application->candidate->email,
                'profile_photo' => $this->mediaUrl($application->candidate->profile_photo),
            ] : null,
            'opportunity' => $application->opportunity ? [
                'id' => $application->opportunity->id,
                'title' => $application->opportunity->title,
                'status' => $application->opportunity->status,
            ] : null,
        ];
    }

    private function opportunityPayload(RecruiterOpportunity $opportunity): array
    {
        return [
            'id' => $opportunity->id,
            'title' => $opportunity->title,
            'company_name' => $opportunity->company_name,
            'status' => $opportunity->status,
            'views' => (int) $opportunity->views,
            'applications_count' => (int) $opportunity->applications_count,
            'unlocks_count' => (int) $opportunity->unlocks_count,
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
}
