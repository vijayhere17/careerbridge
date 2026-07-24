<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\MentorBooking;
use App\Models\SavedMentor;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use App\Http\Resources\DashboardSessionResource;

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

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        return response()->json([
    'stats' => [
        'bookings' => MentorBooking::where('candidate_id', $user->id)->count(),

        'appliedJobs' => JobApplication::where('user_id', $user->id)->count(),

        'savedMentors' => SavedMentor::where('candidate_id', $user->id)->count(),

        'walletBalance' => optional(
            Wallet::where('user_id', $user->id)->first()
        )->balance ?? 0,
    ],

    'upcomingSessions' => DashboardSessionResource::collection(
    MentorBooking::with([
    'mentor.user',
    'service',
])
    ->where('candidate_id', $user->id)
    ->whereIn('status', ['pending', 'accepted'])
    ->orderBy('date')
    ->orderBy('time')
    ->get()
),
]);
    }
}