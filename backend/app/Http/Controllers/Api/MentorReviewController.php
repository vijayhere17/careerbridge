<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MentorReviewResource;
use App\Models\MentorProfile;
use App\Models\MentorReview;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class MentorReviewController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
    }

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

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized',
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

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized',
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

        $mentor = MentorProfile::find($review->mentor_id);
        if ($mentor) {
            $submitted = MentorReview::where('mentor_id', $mentor->id)
                ->where('status', 'submitted')
                ->whereNotNull('rating');

            $mentor->update([
                'rating' => round((float) $submitted->avg('rating'), 1),
                'review_count' => (int) $submitted->count(),
            ]);

            if ($mentor->user) {
                $this->notifications->notify(
                    $mentor->user,
                    'New review received',
                    ($user->name ?: 'A candidate') . ' left a ' . $request->rating . '★ review.',
                    'review',
                    ['review_id' => $review->id, 'booking_id' => $review->booking_id]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully.',
            'review' => new MentorReviewResource($review->fresh()->load(['mentor.user', 'booking.service'])),
        ]);
    }
}
