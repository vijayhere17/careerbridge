<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MentorBookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'mentorId' => (string) $this->mentor_id,
            'mentorName' => $this->mentor?->user?->name ?? 'Mentor',
            'service' => $this->service?->title ?? 'Mentoring Session',
            'sessionType' => $this->service?->session_type ?? 'Video Call',
            'date' => $this->date,
            'time' => $this->time,
            'amount' => (int) $this->amount,
            'status' => ucfirst($this->status),
            'requirements' => $this->requirements,
            'paymentStatus' => $this->payment_status,
        ];
    }
}
