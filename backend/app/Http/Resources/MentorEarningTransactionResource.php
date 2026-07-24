<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MentorEarningTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'candidate' => $this->subtitle,

            'service' => $this->category,

            'amount' => (float)$this->amount,

            'status' => ucfirst($this->status),

            'date' => $this->created_at?->format('d M Y'),

            'reference' => $this->reference,

        ];
    }
}