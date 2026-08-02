<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MentorUpcomingSessionResource;
use App\Models\MentorBooking;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\NotificationService;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MentorUpcomingSessionController extends Controller
{
    public function __construct(
        private WalletService $walletService,
        private NotificationService $notifications,
    ) {
    }

    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    public function complete(Request $request, $id)
    {
        $user = $this->authUser($request);

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $mentorProfile = $user->mentorProfile;

        if (! $mentorProfile) {
            return response()->json([
                'message' => 'Mentor profile not found.',
            ], 404);
        }

        $booking = MentorBooking::with(['candidate', 'service'])
            ->where('id', $id)
            ->where('mentor_id', $mentorProfile->id)
            ->where('status', 'confirmed')
            ->first();

        if (! $booking) {
            return response()->json([
                'message' => 'Upcoming session not found.',
            ], 404);
        }

        $reference = 'SESSION-' . $booking->id;
        $alreadyCredited = WalletTransaction::where('user_id', $user->id)
            ->where('reference', $reference)
            ->exists();

        DB::transaction(function () use ($booking, $user, $mentorProfile, $reference, $alreadyCredited) {
            $booking->update([
                'status' => 'completed',
                'payment_status' => 'released',
            ]);

            $mentorProfile->forceFill([
                'session_count' => (int) $mentorProfile->session_count + 1,
            ])->save();

            if (! $alreadyCredited && (float) $booking->amount > 0) {
                // Mentor earns 70% of the session fee (exclude platform fee if total was charged).
                $sessionFee = (float) ($booking->service?->price ?? $booking->amount);
                if ($sessionFee <= 0) {
                    $sessionFee = (float) $booking->amount;
                }
                $payout = round($sessionFee * 0.7, 2);

                $this->walletService->credit(
                    $user,
                    $payout,
                    'session',
                    'Session earnings',
                    ($booking->service?->title ?? 'Mentoring session') . ' with ' . ($booking->candidate?->name ?? 'candidate'),
                    'success',
                    $reference
                );
            }
        });

        if ($booking->candidate) {
            $this->notifications->notify(
                $booking->candidate,
                'Session completed',
                'Your mentoring session has been marked complete. You can leave a review.',
                'booking',
                ['booking_id' => $booking->id, 'status' => 'completed']
            );

            \App\Models\MentorReview::firstOrCreate(
                [
                    'booking_id' => $booking->id,
                    'user_id' => $booking->candidate_id,
                ],
                [
                    'mentor_id' => $booking->mentor_id,
                    'rating' => null,
                    'comment' => null,
                    'status' => 'pending',
                ]
            );

            $this->notifications->notify(
                $booking->candidate,
                'Review requested',
                'Please rate your session and share feedback for your mentor.',
                'review',
                ['booking_id' => $booking->id]
            );
        }

        $this->notifications->notify(
            $user,
            'Session completed',
            'Session marked complete. Earnings have been credited to your wallet.',
            'payment',
            ['booking_id' => $booking->id, 'status' => 'completed']
        );

        return response()->json([
            'success' => true,
            'message' => 'Session completed successfully.',
        ]);
    }

    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $mentorProfile = $user->mentorProfile;

        if (! $mentorProfile) {
            return response()->json([
                'sessions' => [],
            ]);
        }

        $sessions = MentorBooking::with([
            'candidate',
            'service',
        ])
            ->where('mentor_id', $mentorProfile->id)
            ->where('status', 'confirmed')
            ->orderBy('date')
            ->orderBy('time')
            ->get();

        return response()->json([
            'sessions' => MentorUpcomingSessionResource::collection($sessions),
        ]);
    }
}
