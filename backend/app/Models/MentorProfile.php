<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MentorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company',
        'designation',
        'industry',
        'experience',
        'location',
        'bio',
        'rating',
        'review_count',
        'session_count',
        'verified',
        'available',
        'profile_photo',
    ];

    protected $casts = [
        'verified' => 'boolean',
        'available' => 'boolean',
        'rating' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function services(): HasMany
{
    return $this->hasMany(MentorService::class, 'mentor_id');
}

    public function skills(): HasMany
{
    return $this->hasMany(MentorSkill::class, 'mentor_id');
}

    public function languages(): HasMany
{
    return $this->hasMany(MentorLanguage::class, 'mentor_id');
}

   public function reviews(): HasMany
{
    return $this->hasMany(MentorReview::class, 'mentor_id');
}

    public function bookings(): HasMany
{
    return $this->hasMany(MentorBooking::class, 'mentor_id');
}

    public function savedBy(): HasMany
    {
        return $this->hasMany(SavedMentor::class, 'mentor_id');
    }
}
