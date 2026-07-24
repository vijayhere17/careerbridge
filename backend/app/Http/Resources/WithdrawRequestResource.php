<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WithdrawRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'amount' => (float) $this->amount,

            'bank' => $this->bank_name,

            'account' => $this->account_number,

            'remarks' => $this->remarks,

            'status' => ucfirst($this->status),

            'date' => $this->created_at?->format('d M Y'),

            'adminRemarks' => $this->admin_remarks,

        ];
    }
}