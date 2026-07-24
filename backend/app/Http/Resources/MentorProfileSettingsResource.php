<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MentorProfileSettingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => (string) $this->id,

            'name' => $this->name,

            'last_name' => $this->last_name,

            'full_name' => trim($this->name . ' ' . $this->last_name),

            'email' => $this->email,

            'mobile' => $this->mobile,

            'location' => $this->location,

            'bio' => $this->bio,

            'profile_photo' => $this->profile_photo
                ? asset('storage/' . $this->profile_photo)
                : null,

        ];
    }
}