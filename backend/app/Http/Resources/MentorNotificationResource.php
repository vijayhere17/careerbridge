<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MentorNotificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,

            'title' => $this->title,

            'message' => $this->message,

            'type' => $this->type,

            'read' => (bool) $this->is_read,

            'time' => optional($this->created_at)->diffForHumans(),

            'created_at' => optional($this->created_at)->toDateTimeString(),
        ];
    }
}