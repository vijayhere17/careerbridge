<?php

namespace App\Http\Resources;

use App\Models\MentorReview;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MentorBookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $mentorName = $this->mentor?->user?->name ?? 'Mentor';
        $rawStatus = strtolower((string) $this->status);
        $displayStatus = match ($rawStatus) {
            'confirmed', 'accepted' => 'Upcoming',
            'pending' => 'Pending',
            'completed' => 'Completed',
            'rejected' => 'Rejected',
            'cancelled' => 'Cancelled',
            default => ucfirst($rawStatus),
        };

        $reviewed = MentorReview::where('booking_id', $this->id)
            ->where('status', 'submitted')
            ->exists();

        return [
            'id' => (string) $this->id,
            'mentorId' => (string) $this->mentor_id,
            'mentorName' => $mentorName,
            'mentorInitials' => collect(explode(' ', $mentorName))
                ->filter()
                ->take(2)
                ->map(fn ($part) => strtoupper(substr($part, 0, 1)))
                ->implode(''),
            'service' => $this->service?->title ?? 'Mentoring Session',
            'sessionType' => $this->service?->session_type ?? 'Video Call',
            'date' => $this->date,
            'time' => $this->time,
            'duration' => (int) ($this->service?->duration ?? 30),
            'amount' => (int) $this->amount,
            'status' => $displayStatus,
            'statusRaw' => $rawStatus,
            'requirements' => $this->requirements,
            'paymentStatus' => $this->payment_status,
            'meetLink' => $this->meet_link ?? null,
            'reviewed' => $reviewed,
        ];
    }
}
