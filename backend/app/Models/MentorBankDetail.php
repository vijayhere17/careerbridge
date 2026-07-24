<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentorBankDetail extends Model
{
    protected $fillable = [
        'mentor_id',
        'account_holder',
        'bank_name',
        'account_number',
        'ifsc_code',
        'upi_id',
    ];

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(MentorProfile::class, 'mentor_id');
    }
}