<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MentorNotificationResource;
use App\Models\Notification;
use Illuminate\Http\Request;

class MentorNotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([

            'summary' => [

                'total' => $notifications->count(),

                'bookings' => $notifications
                    ->where('type', 'booking')
                    ->count(),

                'payments' => $notifications
                    ->where('type', 'payment')
                    ->count(),

                'unread' => $notifications
                    ->where('is_read', false)
                    ->count(),

            ],

            'notifications' => MentorNotificationResource::collection($notifications),

        ]);
    }
}