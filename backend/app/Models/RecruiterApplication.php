<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecruiterApplication extends Model
{
    protected $fillable = [
        'recruiter_opportunity_id',
        'candidate_id',
        'status',
        'rating',
        'resume_path',
        'message',
        'recruiter_notes',
        'reject_reason',
        'info_request',
        'expected_salary',
        'interview_status',
        'interview_at',
        'interview_link',
        'hired_at',
        'completed_at',
        'applied_at',
    ];

    protected $casts = [
        'rating' => 'integer',
        'expected_salary' => 'decimal:2',
        'interview_at' => 'datetime',
        'hired_at' => 'datetime',
        'completed_at' => 'datetime',
        'applied_at' => 'datetime',
    ];

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(RecruiterOpportunity::class, 'recruiter_opportunity_id');
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(RecruiterApplicationEvent::class, 'recruiter_application_id')->latest();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(RecruiterMessage::class, 'recruiter_application_id')->latest();
    }

    public function unlocks(): HasMany
    {
        return $this->hasMany(RecruiterContactUnlock::class, 'recruiter_application_id');
    }

    public function resumeUrl(): ?string
    {
        $path = $this->resume_path ?: $this->candidate?->resume_path ?? null;
        if (! $path) {
            return null;
        }

        return str_starts_with($path, 'http')
            ? $path
            : asset('storage/' . ltrim($path, '/'));
    }
}
