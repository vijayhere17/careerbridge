<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MentorIncomingRequestResource;
use App\Models\MentorBooking;
use App\Models\User;
use Illuminate\Http\Request;

class MentorIncomingRequestController extends Controller
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

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $mentorProfile = $user->mentorProfile;

        if (!$mentorProfile) {
            return response()->json([
                'requests' => [],
            ]);
        }

        $requests = MentorBooking::with([
            'candidate',
            'service',
        ])
        ->where('mentor_id', $mentorProfile->id)
        ->whereIn('status', [
    'pending',
    'confirmed',
    'rejected',
])
        ->latest()
        ->get();

        return response()->json([
            'requests' => MentorIncomingRequestResource::collection($requests),
        ]);
    }

    public function accept(Request $request, MentorBooking $booking)
{
    $user = $this->authUser($request);

    if (!$user) {
        return response()->json([
            'message' => 'Unauthorized'
        ], 401);
    }

    $mentorProfile = $user->mentorProfile;

    if (
        !$mentorProfile ||
        $booking->mentor_id !== $mentorProfile->id
    ) {
        return response()->json([
            'message' => 'Booking not found.'
        ], 404);
    }

    if ($booking->status !== 'pending') {
        return response()->json([
            'message' => 'This booking request has already been processed.'
        ], 422);
    }

    $booking->update([
        'status' => 'confirmed',
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Booking accepted successfully.',
        'booking_status' => $booking->status,
    ]);
}

public function reject(Request $request, MentorBooking $booking)
{
    $user = $this->authUser($request);

    if (!$user) {
        return response()->json([
            'message' => 'Unauthorized'
        ], 401);
    }

    $mentorProfile = $user->mentorProfile;

    if (
        !$mentorProfile ||
        $booking->mentor_id !== $mentorProfile->id
    ) {
        return response()->json([
            'message' => 'Booking not found.'
        ], 404);
    }

    if ($booking->status !== 'pending') {
        return response()->json([
            'message' => 'This booking request has already been processed.'
        ], 422);
    }

    $booking->update([
        'status' => 'rejected',
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Booking rejected successfully.',
        'booking_status' => $booking->status,
    ]);
}
}