<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MentorIncomingRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
{
    $candidateName = $this->candidate?->name ?? '';

    return [
        'id' => (string) $this->id,

        'candidateName' => $candidateName,

        'candidateInitials' => collect(explode(' ', $candidateName))
            ->filter()
            ->take(2)
            ->map(fn ($name) => strtoupper(substr($name, 0, 1)))
            ->implode(''),

        'candidateRole' => $this->candidate?->current_role
            ?? $this->candidate?->role
            ?? 'Candidate',

        'candidatePhoto' => $this->candidate?->profile_photo
            ? asset('storage/' . $this->candidate->profile_photo)
            : null,

        'service' => $this->service?->title ?? 'Mentoring Session',

        'sessionType' => match ($this->service?->session_type) {
            'audio' => 'Audio Call',
            'chat' => 'Chat',
            default => 'Video Call',
        },

        'date' => $this->date,

        'time' => $this->time,

        'duration' => (int) ($this->service?->duration ?? 30),

        'requirements' => $this->requirements,

        'amount' => (int) $this->amount,

        'status' => $this->status === 'confirmed'
            ? 'accepted'
            : $this->status,

        'paymentStatus' => $this->payment_status,

        'requestedAt' => $this->created_at?->diffForHumans() ?? '',
    ];
}
}