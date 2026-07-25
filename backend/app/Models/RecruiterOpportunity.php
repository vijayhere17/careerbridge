<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecruiterOpportunity extends Model
{
    protected $fillable = [
        'user_id',
        'duplicated_from_id',
        'opportunity_type',
        'title',
        'company_name',
        'location',
        'employment_type',
        'experience_level',
        'salary_min',
        'salary_max',
        'application_deadline',
        'skills',
        'description',
        'responsibilities',
        'requirements',
        'benefits',
        'work_mode',
        'contact_visibility',
        'contact_price',
        'status',
        'views',
        'applications_count',
        'unlocks_count',
        'published_at',
        'closed_at',
        'archived_at',
    ];

    protected $casts = [
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'contact_price' => 'decimal:2',
        'application_deadline' => 'date',
        'views' => 'integer',
        'applications_count' => 'integer',
        'unlocks_count' => 'integer',
        'published_at' => 'datetime',
        'closed_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(RecruiterApplication::class, 'recruiter_opportunity_id');
    }

    public function unlocks(): HasMany
    {
        return $this->hasMany(RecruiterContactUnlock::class, 'recruiter_opportunity_id');
    }

    public function publish(): void
    {
        $this->forceFill([
            'status' => 'published',
            'published_at' => $this->published_at ?? now(),
            'closed_at' => null,
            'archived_at' => null,
        ])->save();
    }

    public function draft(): void
    {
        $this->forceFill([
            'status' => 'draft',
            'closed_at' => null,
            'archived_at' => null,
        ])->save();
    }

    public function close(): void
    {
        $this->forceFill([
            'status' => 'closed',
            'closed_at' => now(),
        ])->save();
    }

    public function archive(): void
    {
        $this->forceFill([
            'status' => 'archived',
            'archived_at' => now(),
            'closed_at' => $this->closed_at ?? now(),
        ])->save();
    }

    public function pause(): void
    {
        $this->forceFill(['status' => 'paused'])->save();
    }

    public function duplicateFor(int $userId): self
    {
        $copy = $this->replicate(['published_at', 'closed_at', 'archived_at', 'views', 'applications_count', 'unlocks_count']);
        $copy->user_id = $userId;
        $copy->duplicated_from_id = $this->id;
        $copy->title = $this->title . ' (Copy)';
        $copy->status = 'draft';
        $copy->views = 0;
        $copy->applications_count = 0;
        $copy->unlocks_count = 0;
        $copy->published_at = null;
        $copy->closed_at = null;
        $copy->archived_at = null;
        $copy->save();

        return $copy;
    }
}
