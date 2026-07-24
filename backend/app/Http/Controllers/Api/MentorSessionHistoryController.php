<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MentorSessionHistoryResource;
use App\Models\MentorBooking;
use App\Models\User;
use Illuminate\Http\Request;

class MentorSessionHistoryController extends Controller
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
                'sessions' => [],
            ]);
        }

        $sessions = MentorBooking::with([
            'candidate',
            'service',
        ])
        ->where('mentor_id', $mentorProfile->id)
        ->whereIn('status', [
            'completed',
            'cancelled',
            'refunded',
            'no_show',
        ])
        ->latest()
        ->get();

        return response()->json([
            'sessions' => MentorSessionHistoryResource::collection($sessions),
        ]);
    }
}