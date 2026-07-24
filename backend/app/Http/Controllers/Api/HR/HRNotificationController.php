<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\Notification;
use Illuminate\Http\Request;

class HRNotificationController extends HRBaseController
{
    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->limit(50)
            ->get();

        $unread = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return $this->success([
            'notifications' => $notifications,
            'unread_count' => $unread,
        ]);
    }

    public function markRead(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $notification = Notification::where('user_id', $user->id)->find($id);

        if (!$notification) {
            return $this->notFound('Notification not found.');
        }

        $notification->forceFill([
            'is_read' => true,
            'read_at' => now(),
        ])->save();

        return $this->success($notification, 'Notification marked as read.');
    }

    public function markAllRead(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return $this->success(null, 'All notifications marked as read.');
    }
}
