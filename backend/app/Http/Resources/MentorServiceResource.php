<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MentorServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'duration' => (string) $this->duration . ' min',
            'price' => (int) $this->price,
            'type' => $this->session_type,
            'status' => $this->status,
        ];
    }
}
