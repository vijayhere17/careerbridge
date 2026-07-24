<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MentorSessionHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => (string) $this->id,

            'candidateName' => $this->candidate?->name ?? '',

            'candidateInitials' => collect(explode(' ', $this->candidate?->name))
                ->map(fn ($word) => strtoupper(substr($word, 0, 1)))
                ->take(2)
                ->implode(''),

            'candidateRole' => $this->candidate?->current_role ?? '',

            'company' => $this->candidate?->company ?? '',

            'service' => $this->service?->title ?? '',

            // Temporary default values until these are stored in DB
            'sessionType' => 'Video Call',

            'duration' => 60,

            'rating' => 0,

            'amount' => (int) $this->amount,

            'status' => ucfirst(str_replace('_', ' ', $this->status)),

            'date' => $this->date,

            'time' => $this->time,

            'mentorNotes' => '',

            'candidateReview' => '',

            'completedAt' => optional($this->updated_at)
                ->format('d M Y h:i A'),
        ];
    }
}