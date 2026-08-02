<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentorBooking extends Model
{
    use HasFactory;

    protected $fillable = [
        'mentor_id',
        'candidate_id',
        'service_id',
        'date',
        'time',
        'requirements',
        'amount',
        'status',
        'payment_status',
        'meet_link',
    ];

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(MentorProfile::class, 'mentor_id');
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(MentorService::class, 'service_id');
    }
}
