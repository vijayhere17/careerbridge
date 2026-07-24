<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MentorReviewResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,

            // Mentor
            'mentorName' => $this->mentor?->user?->name,

            'mentorInitials' => collect(explode(' ', $this->mentor?->user?->name ?? ''))
                ->filter()
                ->map(fn ($part) => strtoupper(substr($part, 0, 1)))
                ->take(2)
                ->implode(''),

            // Candidate
            'candidate' => $this->user?->name,
            'candidate_photo' => $this->user?->profile_photo,

            // Booking Details
            'company' => $this->mentor?->company ?? '-',
            'service' => $this->booking?->service?->title ?? 'Mentorship Session',
            'booking_id' => $this->booking_id,
            'sessionDate' => $this->booking?->date,

            // Review
            'rating' => (int) $this->rating,
            'comment' => $this->comment,
            'status' => $this->status,
            'helpfulCount' => (int) $this->helpful_count,

            // Dates
            'submittedDate' => optional($this->submitted_at)->toDateString(),
            'date' => optional($this->submitted_at)->format('d M Y'),

            // Timestamps
            'created_at' => optional($this->created_at)->toDateTimeString(),
            'updated_at' => optional($this->updated_at)->toDateTimeString(),
        ];
    }
}
