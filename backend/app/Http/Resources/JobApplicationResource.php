<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => (string) $this->id,

            'opportunityId' => (string) $this->opportunity_id,

            'source' => 'legacy',

            'category' => $this->opportunity?->category,

            'opportunityType' => match ($this->opportunity?->category) {
                'internships', 'internship' => 'internship',
                'freelance' => 'freelance',
                default => 'job',
            },

            'company' => $this->opportunity?->company,

            'companyLogo' => $this->opportunity?->company_logo,

            'recruiter' => $this->opportunity?->provider_name
                ?: $this->opportunity?->user?->name,

            'title' => $this->opportunity?->title,

            'role' => $this->opportunity?->role,

            'location' => $this->opportunity?->location,

            'salary' => $this->opportunity?->salary,

            'workType' => $this->opportunity?->work_type,

            'jobType' => $this->opportunity?->employment_type,

            'employmentType' => $this->opportunity?->employment_type,

            'duration' => $this->opportunity?->duration,

            'ppoChance' => (bool) ($this->opportunity?->ppo_chance ?? false),

            'status' => $this->status,

            'message' => $this->message,

            'resume' => $this->resume,

            'appliedAt' => optional($this->applied_at)->toISOString(),

            'lastUpdate' => optional($this->updated_at)->toISOString(),

            // Future fields
            'interviewDate' => $this->interview_date,

            'offerAmount' => $this->offer_amount,

            'rejectionReason' => $this->rejection_reason,
        ];
    }
}