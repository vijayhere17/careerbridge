<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MentorReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $candidate = $this->candidate;

        return [
            'id' => (string) $this->id,
            'candidateName' => $candidate?->name ?? 'Candidate',
            'rating' => (int) $this->rating,
            'comment' => $this->review,
            'date' => $this->created_at?->diffForHumans() ?? 'Just now',
        ];
    }
}
