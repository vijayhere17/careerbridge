<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MentorUpcomingSessionResource;
use App\Models\MentorBooking;
use App\Models\User;
use Illuminate\Http\Request;

class MentorUpcomingSessionController extends Controller
{
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

    if (!$user) {
        return response()->json([
            'message' => 'Unauthorized'
        ], 401);
    }

    $mentorProfile = $user->mentorProfile;

    if (!$mentorProfile) {
        return response()->json([
            'message' => 'Mentor profile not found.'
        ], 404);
    }

    $booking = MentorBooking::where('id', $id)
        ->where('mentor_id', $mentorProfile->id)
        ->where('status', 'confirmed')
        ->first();

    if (!$booking) {
        return response()->json([
            'message' => 'Upcoming session not found.'
        ], 404);
    }

    $booking->update([
        'status' => 'completed',
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Session completed successfully.',
    ]);
}

    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $mentorProfile = $user->mentorProfile;

        if (!$mentorProfile) {
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