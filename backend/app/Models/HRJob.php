<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HRJob extends Model
{
    use HasFactory;

    protected $table = 'hr_jobs';

    protected $fillable = [
        'hr_id',
        'recruiter_opportunity_id',
        'title',
        'department',
        'location',
        'employment_type',
        'experience',
        'salary_min',
        'salary_max',
        'openings',
        'status',
        'description',
        'requirements',
        'responsibilities',
        'published_at',
        'closed_at',
    ];

    protected $casts = [
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'openings' => 'integer',
        'published_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function hr(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hr_id');
    }

    public function recruiterOpportunity(): BelongsTo
    {
        return $this->belongsTo(RecruiterOpportunity::class, 'recruiter_opportunity_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(HRApplication::class, 'job_id');
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    public function publish(): void
    {
        $this->forceFill([
            'status' => 'open',
            'published_at' => now(),
            'closed_at' => null,
        ])->save();
    }

    public function close(): void
    {
        $this->forceFill([
            'status' => 'closed',
            'closed_at' => now(),
        ])->save();
    }
}
