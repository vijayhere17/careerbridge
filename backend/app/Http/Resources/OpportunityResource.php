<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,

            'category' => $this->category,

            'company' => $this->company,
            'companyLogo' => $this->company_logo,

            'title' => $this->title,
            'role' => $this->role,

            'industry' => $this->industry,
            'domain' => $this->domain,

            'location' => $this->location,
            'workType' => $this->work_type,

            'experience' => $this->experience,
            'salary' => $this->salary,

            'employmentType' => $this->employment_type,

'duration' => $this->duration,

'ppoChance' => (bool) $this->ppo_chance,

            'description' => $this->description,

            'provider' => [
                'name' => $this->provider_name,
                'type' => $this->provider_type,
                'verified' => (bool) $this->provider_verified,
            ],

            'contactPrice' => (int) $this->contact_price,

            'phone' => $this->phone,
'email' => $this->email,
'whatsapp' => $this->whatsapp,
'linkedin' => $this->linkedin,
'applyUrl' => $this->apply_url,

            'skills' => $this->skills->pluck('skill')->values(),

            'benefits' => $this->benefits->pluck('benefit')->values(),

            'featured' => (bool) $this->featured,
            'verified' => (bool) $this->verified,
            'active' => (bool) $this->active,

            'createdAt' => optional($this->created_at)->toISOString(),
        ];
    }
}