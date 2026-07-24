<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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

        $validator = Validator::make($request->query(), [
            'unread' => 'nullable|boolean',
            'type' => 'nullable|string|max:100',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $query = Notification::where('user_id', $user->id);

        if ($request->has('unread')) {
            $query->where('is_read', $request->boolean('unread') ? false : true);
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->query('per_page', 20), 100);
        $notifications = $query->latest()->paginate($perPage);
        $notifications->getCollection()->transform(fn (Notification $notification) => $this->transform($notification));

        return $this->success([
            'notifications' => $notifications,
            'unread_count' => $this->countUnread($user->id),
        ], 'Notifications retrieved successfully.');
    }

    public function unreadCount(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        return $this->success([
            'unread_count' => $this->countUnread($user->id),
        ], 'Unread notification count retrieved successfully.');
    }

    public function markRead(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $notification = Notification::where('user_id', $user->id)->find($id);

        if (!$notification) {
            return $this->notFound('Notification not found.');
        }

        $notification->forceFill([
            'is_read' => true,
            'read_at' => $notification->read_at ?? now(),
        ])->save();

        return $this->success($this->transform($notification), 'Notification marked as read.');
    }

    public function markAllRead(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $updated = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return $this->success([
            'updated' => $updated,
            'unread_count' => 0,
        ], 'All notifications marked as read.');
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $notification = Notification::where('user_id', $user->id)->find($id);

        if (!$notification) {
            return $this->notFound('Notification not found.');
        }

        $notification->delete();

        return $this->success([
            'unread_count' => $this->countUnread($user->id),
        ], 'Notification deleted.');
    }

    private function countUnread(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }

    private function transform(Notification $notification): array
    {
        return [
            'id' => $notification->id,
            'title' => $notification->title,
            'message' => $notification->message,
            'type' => $notification->type,
            'is_read' => (bool) $notification->is_read,
            'read_at' => $notification->read_at,
            'data' => $notification->data ?? [],
            'created_at' => $notification->created_at,
            'updated_at' => $notification->updated_at,
        ];
    }
}
