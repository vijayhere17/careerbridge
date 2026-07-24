<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'id' => (string) $this->id,

            'firstName' => $this->name ?? '',

'lastName' => $this->last_name ?? '',

'email' => $this->email ?? '',

'phone' => $this->mobile ?? '',

'location' => $this->location ?? '',

'bio' => $this->bio ?? '',

'currentRole' => $this->current_role ?? '',

'company' => $this->company ?? '',

'experience' => $this->experience ?? '',

'education' => $this->education ?? '',
'skills' => is_array($this->skills)
    ? $this->skills
    : (json_decode($this->skills ?? '[]', true) ?: []),

'linkedin' => $this->linkedin ?? '',

'github' => $this->github ?? '',

'portfolio' => $this->portfolio ?? '',

            'lookingFor' => $this->looking_for ?? [],

            'profilePhoto' => $this->profile_photo
                ? asset('storage/' . $this->profile_photo)
                : null,

        ];
    }
}