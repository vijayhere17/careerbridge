<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Throwable;

class NotificationService
{
    public function notify(User $user, string $title, string $message, string $type = 'system', array $data = []): ?Notification
    {
        try {
            return Notification::create([
                'user_id' => $user->id,
                'title' => $title,
                'message' => $message,
                'type' => $this->safeType($type),
                'is_read' => false,
                'data' => $data ?: null,
            ]);
        } catch (Throwable $e) {
            // Prefer 'system' if the DB enum rejects a custom type (SQLite / older schemas).
            if ($type !== 'system') {
                try {
                    return Notification::create([
                        'user_id' => $user->id,
                        'title' => $title,
                        'message' => $message,
                        'type' => 'system',
                        'is_read' => false,
                        'data' => array_merge($data, ['intended_type' => $type]) ?: null,
                    ]);
                } catch (Throwable) {
                    return null;
                }
            }

            return null;
        }
    }

    private function safeType(string $type): string
    {
        $allowed = [
            'booking', 'payment', 'review', 'system', 'application',
            'interview', 'offer', 'job', 'recruiter', 'unlock', 'withdraw', 'message',
        ];

        return in_array($type, $allowed, true) ? $type : 'system';
    }
}
