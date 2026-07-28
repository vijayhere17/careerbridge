<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MentorNotificationResource;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class SeekerNotificationController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken()
            ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (! $user || $user->role !== 'seeker') {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'summary' => [
                'total' => $notifications->count(),
                'bookings' => $notifications->where('type', 'booking')->count(),
                'payments' => $notifications->whereIn('type', ['payment', 'withdraw'])->count(),
                'unread' => $notifications->where('is_read', false)->count(),
            ],
            'notifications' => MentorNotificationResource::collection($notifications),
        ]);
    }

    public function markRead(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (! $user || $user->role !== 'seeker') {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notification = Notification::where('user_id', $user->id)->find($id);

        if (! $notification) {
            return response()->json(['message' => 'Notification not found.'], 404);
        }

        $notification->forceFill([
            'is_read' => true,
            'read_at' => $notification->read_at ?? now(),
        ])->save();

        return response()->json([
            'success' => true,
            'notification' => new MentorNotificationResource($notification),
        ]);
    }

    public function markAllRead(Request $request)
    {
        $user = $this->authUser($request);

        if (! $user || $user->role !== 'seeker') {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $updated = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'updated' => $updated,
            'unread' => 0,
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (! $user || $user->role !== 'seeker') {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notification = Notification::where('user_id', $user->id)->find($id);

        if (! $notification) {
            return response()->json(['message' => 'Notification not found.'], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'unread' => Notification::where('user_id', $user->id)->where('is_read', false)->count(),
        ]);
    }
}
