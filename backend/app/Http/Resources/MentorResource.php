<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MentorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->user?->name ?? 'Mentor',
            'initials' => $this->initials ?? strtoupper(substr($this->user?->name ?? 'M', 0, 2)),
            'avatarColor' => $this->profile_photo ? null : '#2563EB',
            'role' => $this->designation ?? 'Mentor',
            'company' => $this->company,
'companySlug' => str($this->company)->slug()->toString(),
'industry' => $this->industry,
            'experience' => (int) $this->experience,
            'experienceLabel' => $this->experience
                ? ((int) $this->experience) . '+ yrs'
                : '—',
            'location' => $this->location,
            'languages' => $this->languages->pluck('language')->values()->toArray(),
            'bio' => $this->bio,
            'skills' => $this->skills->pluck('skill')->values()->toArray(),
            'rating' => (float) $this->rating,
            'reviews' => (int) $this->review_count,
            'sessions' => (int) $this->session_count,
            'pricePerSession' => (int) ($this->services->min('price') ?? 0),
            'responseTime' => 'Within 1 day',
            'available' => (bool) $this->available,
            'verified' => (bool) $this->verified,
            'profilePhoto' => $this->profile_photo
                ? (str_starts_with($this->profile_photo, 'http')
                    ? $this->profile_photo
                    : asset('storage/' . ltrim($this->profile_photo, '/')))
                : null,
            'services' => MentorServiceResource::collection($this->services),
            'journey' => [],
            'achievements' => [],
            'certifications' => [],
            'testimonials' => MentorReviewResource::collection(
                $this->reviews->where('status', 'submitted')->values()
            ),
            'faqs' => [],
        ];
    }
}
