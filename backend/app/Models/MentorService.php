<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MentorService extends Model
{
    use HasFactory;

    protected $fillable = [
        'mentor_id',
        'title',
        'description',
        'price',
        'duration',
        'session_type',
        'status',
    ];

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(MentorProfile::class, 'mentor_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(MentorBooking::class, 'service_id');
    }
}
