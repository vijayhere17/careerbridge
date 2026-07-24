<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardSessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'mentor_name' => $this->mentor?->user?->name ?? 'Mentor',

            'topic' => $this->service?->title ?? 'Mentorship Session',

            'scheduled_at' => $this->date . ' ' . $this->time,

            'status' => $this->status,
        ];
    }
}