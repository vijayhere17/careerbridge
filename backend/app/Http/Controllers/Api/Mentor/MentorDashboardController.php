<?php

namespace App\Http\Controllers\Api\Mentor;

use App\Http\Controllers\Controller;
use App\Models\MentorBooking;
use App\Models\MentorProfile;
use App\Models\MentorReview;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;

class MentorDashboardController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken()
            ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    private function initials(?string $name): string
    {
        return collect(explode(' ', $name ?? ''))
            ->filter()
            ->take(2)
            ->map(fn ($part) => strtoupper(substr($part, 0, 1)))
            ->implode('');
    }

    private function sessionType(?string $type): string
    {
        return match ($type) {
            'audio' => 'Audio Call',
            'chat' => 'Chat',
            default => 'Video Call',
        };
    }

    private function mediaUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return str_starts_with($path, 'http')
            ? $path
            : asset('storage/' . ltrim($path, '/'));
    }

    private function profileCompletion(User $user, ?MentorProfile $profile): int
    {
        if (!$profile) {
            return 0;
        }

        $fields = [
            $user->name,
            $user->email,
            $profile->company,
            $profile->designation,
            $profile->industry,
            $profile->experience,
            $profile->location,
            $profile->bio,
            $profile->linkedin_url,
            $profile->professional_summary,
            $profile->profile_photo,
        ];

        $filled = collect($fields)
            ->filter(fn ($value) => filled($value))
            ->count();

        return (int) round(($filled / count($fields)) * 100);
    }

    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $profile = $user->mentorProfile;

        if (!$profile) {
            return response()->json([
                'mentor' => [
                    'name' => $user->name,
                    'designation' => null,
                    'company' => null,
                    'rating' => 0,
                    'total_reviews' => 0,
                    'total_sessions' => 0,
                    'profile_photo' => null,
                    'experience' => null,
                    'verified' => false,
                    'available' => false,
                    'profile_completion' => 0,
                ],
                'stats' => [
                    'today_sessions' => 0,
                    'pending_requests' => 0,
                    'wallet_balance' => 0,
                    'monthly_earnings' => 0,
                ],
                'earnings' => [
                    'total' => 0,
                    'month' => 0,
                    'pending' => 0,
                ],
                'upcoming_sessions' => [],
                'pending_requests' => [],
                'recent_reviews' => [],
            ]);
        }

        $wallet = Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        $confirmedBookings = MentorBooking::query()
            ->where('mentor_id', $profile->id)
            ->where('status', 'confirmed');

        $todaySessions = (clone $confirmedBookings)
            ->whereDate('date', today())
            ->count();

        $pendingRequests = MentorBooking::query()
            ->where('mentor_id', $profile->id)
            ->where('status', 'pending')
            ->count();

        $monthlyEarnings = WalletTransaction::query()
            ->where('user_id', $user->id)
            ->where('type', 'credit')
            ->where('status', 'success')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        $reviewsQuery = MentorReview::query()
            ->where('mentor_id', $profile->id)
            ->where('status', 'submitted');

        $averageRating = (clone $reviewsQuery)->avg('rating') ?? 0;
        $totalReviews = (clone $reviewsQuery)->count();

        $totalSessions = MentorBooking::query()
            ->where('mentor_id', $profile->id)
            ->where('status', 'completed')
            ->count();

        $upcomingSessions = MentorBooking::with(['candidate', 'service'])
            ->where('mentor_id', $profile->id)
            ->where('status', 'confirmed')
            ->whereDate('date', '>=', today())
            ->orderBy('date')
            ->orderBy('time')
            ->limit(5)
            ->get()
            ->map(function (MentorBooking $booking) {
                $candidateName = $booking->candidate?->name ?? 'Candidate';

                return [
                    'id' => (string) $booking->id,
                    'candidateName' => $candidateName,
                    'candidateInitials' => $this->initials($candidateName),
                    'candidateRole' => $booking->candidate?->current_role
                        ?? $booking->candidate?->role
                        ?? 'Candidate',
                    'service' => $booking->service?->title ?? 'Mentoring Session',
                    'sessionType' => $this->sessionType($booking->service?->session_type),
                    'date' => $booking->date,
                    'time' => $booking->time,
                    'duration' => (int) ($booking->service?->duration ?? 30),
                    'amount' => (int) $booking->amount,
                    'status' => $booking->status,
                    'paymentStatus' => $booking->payment_status,
                ];
            });

        $latestPendingRequests = MentorBooking::with(['candidate', 'service'])
            ->where('mentor_id', $profile->id)
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function (MentorBooking $booking) {
                $candidateName = $booking->candidate?->name ?? 'Candidate';

                return [
                    'id' => (string) $booking->id,
                    'candidateName' => $candidateName,
                    'candidateInitials' => $this->initials($candidateName),
                    'candidateRole' => $booking->candidate?->current_role
                        ?? $booking->candidate?->role
                        ?? 'Candidate',
                    'service' => $booking->service?->title ?? 'Mentoring Session',
                    'sessionType' => $this->sessionType($booking->service?->session_type),
                    'date' => $booking->date,
                    'time' => $booking->time,
                    'duration' => (int) ($booking->service?->duration ?? 30),
                    'amount' => (int) $booking->amount,
                    'status' => 'pending',
                    'requestedAt' => $booking->created_at?->diffForHumans() ?? '',
                ];
            });

        $recentReviews = MentorReview::with(['user', 'booking.service'])
            ->where('mentor_id', $profile->id)
            ->where('status', 'submitted')
            ->latest('submitted_at')
            ->limit(5)
            ->get()
            ->map(function (MentorReview $review) {
                return [
                    'id' => (string) $review->id,
                    'candidate' => $review->user?->name ?? 'Candidate',
                    'rating' => (int) $review->rating,
                    'comment' => $review->comment,
                    'service' => $review->booking?->service?->title ?? 'Mentoring Session',
                    'date' => $review->submitted_at
                        ? $review->submitted_at->diffForHumans()
                        : $review->created_at?->diffForHumans(),
                    'submitted_at' => $review->submitted_at,
                    'helpful_count' => (int) $review->helpful_count,
                ];
            });

        return response()->json([
            'mentor' => [
                'name' => $user->name,
                'designation' => $profile->designation,
                'company' => $profile->company,
                'rating' => round($averageRating, 1),
                'total_reviews' => $totalReviews,
                'total_sessions' => $totalSessions,
                'profile_photo' => $this->mediaUrl($profile->profile_photo),
                'experience' => $profile->experience,
                'verified' => (bool) $profile->verified,
                'available' => (bool) $profile->available,
                'profile_completion' => $this->profileCompletion($user, $profile),
            ],

            'stats' => [
                'today_sessions' => $todaySessions,
                'pending_requests' => $pendingRequests,
                'wallet_balance' => (float) $wallet->balance,
                'monthly_earnings' => (float) $monthlyEarnings,
            ],

            'earnings' => [
                'total' => (float) WalletTransaction::where('user_id', $user->id)
                    ->where('type', 'credit')
                    ->where('status', 'success')
                    ->sum('amount'),

                'month' => (float) $monthlyEarnings,

                'pending' => (float) WalletTransaction::where('user_id', $user->id)
                    ->where('status', 'pending')
                    ->sum('amount'),
            ],

            'upcoming_sessions' => $upcomingSessions,
            'pending_requests' => $latestPendingRequests,
            'recent_reviews' => $recentReviews,
        ]);
    }
}
