<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MentorReviewResource;
use App\Models\MentorReview;
use App\Models\User;
use Illuminate\Http\Request;

class MentorReviewsController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        if ($token && $user = User::where('api_token', $token)->first()) {
            return $user;
        }

        return $request->user('sanctum');
    }

    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $mentor = $user->mentorProfile;

        if (!$mentor) {
            return response()->json([
                'message' => 'Mentor profile not found.'
            ], 404);
        }

        $reviews = MentorReview::with([
                'user',
                'booking.service',
                'mentor',
            ])
            ->where('mentor_id', $mentor->id)
            ->latest('submitted_at')
            ->get();

        $totalReviews = $reviews->count();

        $averageRating = $totalReviews > 0
            ? round($reviews->avg('rating'), 1)
            : 0;

        $positivePercentage = $totalReviews > 0
            ? round(
                ($reviews->where('rating', '>=', 4)->count() / $totalReviews) * 100
            )
            : 0;

        $thisMonth = $reviews
            ->filter(function ($review) {
                return $review->submitted_at &&
                    $review->submitted_at->isCurrentMonth();
            })
            ->count();

        $distribution = [];

        for ($star = 5; $star >= 1; $star--) {

            $count = $reviews->where('rating', $star)->count();

            $distribution[] = [
                'star' => $star,
                'count' => $count,
                'percentage' => $totalReviews > 0
                    ? round(($count / $totalReviews) * 100)
                    : 0,
            ];
        }

        $topService = $reviews
            ->groupBy(fn ($review) => $review->booking?->service?->title ?? 'Mentoring Session')
            ->map(fn ($group) => [
                'service' => $group->first()->booking?->service?->title ?? 'Mentoring Session',
                'average' => round($group->avg('rating'), 1),
                'count' => $group->count(),
            ])
            ->sortByDesc('average')
            ->first();

        $repeatClients = $reviews
            ->groupBy('user_id')
            ->filter(fn ($group) => $group->count() > 1)
            ->count();

        $uniqueClients = max($reviews->pluck('user_id')->unique()->count(), 1);

        return response()->json([
            'summary' => [
                'average_rating' => $averageRating,
                'total_reviews' => $totalReviews,
                'positive_percentage' => $positivePercentage,
                'this_month' => $thisMonth,
            ],

            'distribution' => $distribution,

            'insights' => [
                'strongest_area' => $topService['service'] ?? 'Mentoring sessions',
                'candidate_satisfaction' => $positivePercentage,
                'repeat_client_percentage' => $totalReviews > 0
                    ? round(($repeatClients / $uniqueClients) * 100)
                    : 0,
                'this_month_reviews' => $thisMonth,
            ],

            'reviews' => MentorReviewResource::collection($reviews),
        ]);
    }
}
