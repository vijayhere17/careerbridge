<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DashboardSessionResource;
use App\Http\Resources\MentorResource;
use App\Models\JobApplication;
use App\Models\MentorBooking;
use App\Models\MentorProfile;
use App\Models\Notification;
use App\Models\RecruiterApplication;
use App\Models\SavedMentor;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $upcoming = MentorBooking::with([
            'mentor.user',
            'service',
        ])
            ->where('candidate_id', $user->id)
            ->whereIn('status', ['pending', 'confirmed', 'accepted'])
            ->orderBy('date')
            ->orderBy('time')
            ->limit(5)
            ->get();

        $featuredMentors = MentorProfile::query()
            ->with([
                'user',
                'services' => fn ($q) => $q->where('status', 'active'),
                'skills',
                'languages',
                'reviews' => fn ($q) => $q->where('status', 'submitted')->latest()->limit(3),
            ])
            ->where('onboarding_status', 'approved')
            ->where('verified', true)
            ->where('available', true)
            ->orderByDesc('rating')
            ->orderByDesc('session_count')
            ->limit(6)
            ->get();

        $recentNotifications = Notification::where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Notification $n) => [
                'id' => (string) $n->id,
                'title' => $n->title,
                'message' => $n->message,
                'type' => $n->type,
                'read' => (bool) $n->is_read,
                'time' => optional($n->created_at)->diffForHumans(),
            ]);

        $completedCount = MentorBooking::where('candidate_id', $user->id)
            ->where('status', 'completed')
            ->count();

        $profileCompletion = $this->profileCompletion($user);

        $legacyApps = JobApplication::where('user_id', $user->id)->count();
        $recruiterApps = RecruiterApplication::where('candidate_id', $user->id)->count();
        $hasApplied = $legacyApps > 0 || $recruiterApps > 0;

        return response()->json([
            'stats' => [
                'bookings' => MentorBooking::where('candidate_id', $user->id)->count(),
                'appliedJobs' => $legacyApps + $recruiterApps,
                'savedMentors' => SavedMentor::where('candidate_id', $user->id)->count(),
                'walletBalance' => (float) (optional(
                    Wallet::where('user_id', $user->id)->first()
                )->balance ?? 0),
                'completedSessions' => $completedCount,
                'unreadNotifications' => Notification::where('user_id', $user->id)
                    ->where('is_read', false)
                    ->count(),
                'profileCompletion' => $profileCompletion,
            ],

            'upcomingSessions' => DashboardSessionResource::collection($upcoming),
            'featuredMentors' => MentorResource::collection($featuredMentors),
            'recentNotifications' => $recentNotifications,
            'checklist' => [
                [
                    'step' => '1',
                    'title' => 'Complete your profile',
                    'desc' => 'Add skills and goals',
                    'done' => $profileCompletion >= 70,
                    'nav' => 'Profile Settings',
                ],
                [
                    'step' => '2',
                    'title' => 'Find a mentor',
                    'desc' => 'Connect with industry experts',
                    'done' => SavedMentor::where('candidate_id', $user->id)->exists()
                        || MentorBooking::where('candidate_id', $user->id)->exists(),
                    'nav' => 'Find Mentors',
                ],
                [
                    'step' => '3',
                    'title' => 'Browse opportunities',
                    'desc' => 'Explore jobs & internships',
                    'done' => $hasApplied,
                    'nav' => 'Opportunities Hub',
                ],
                [
                    'step' => '4',
                    'title' => 'Book your first session',
                    'desc' => 'Start your mentorship journey',
                    'done' => MentorBooking::where('candidate_id', $user->id)->exists(),
                    'nav' => 'My Bookings',
                ],
            ],
        ]);
    }

    private function profileCompletion(User $user): int
    {
        $fields = [
            $user->name,
            $user->email,
            $user->mobile,
            $user->profile_photo ?? null,
            $user->bio ?? null,
            $user->current_role ?? null,
            $user->location ?? null,
        ];

        $filled = collect($fields)->filter(fn ($value) => filled($value))->count();

        return (int) round(($filled / max(count($fields), 1)) * 100);
    }
}
