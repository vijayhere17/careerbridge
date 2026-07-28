<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MentorReviewResource;
use App\Models\MentorReview;
use App\Models\User;
use Illuminate\Http\Request;

class MentorReviewController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    /**
     * GET /api/reviews
     */
    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $reviews = MentorReview::with([
    'mentor.user',
    'booking.service',
])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'reviews' => MentorReviewResource::collection($reviews),
        ]);
    }

    /**
     * POST /api/reviews
     */
    public function store(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $request->validate([
            'review_id' => 'required|exists:mentor_reviews,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        $review = MentorReview::where('id', $request->review_id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $review->update([
            'rating' => $request->rating,
            'comment' => $request->comment,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully.',
            'review' => new MentorReviewResource($review),
        ]);
    }
}