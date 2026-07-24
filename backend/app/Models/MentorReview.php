<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentorReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'mentor_id',
        'user_id',
        'rating',
        'comment',
        'status',
        'helpful_count',
        'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

 public function mentor(): BelongsTo
{
    return $this->belongsTo(MentorProfile::class, 'mentor_id');
}

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(MentorBooking::class, 'booking_id');
    }
}