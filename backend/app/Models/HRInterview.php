<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HRInterview extends Model
{
    use HasFactory;

    protected $table = 'hr_interviews';

    protected $fillable = [
        'application_id',
        'hr_id',
        'interviewer_name',
        'interview_type',
        'meeting_link',
        'scheduled_at',
        'duration',
        'status',
        'feedback',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'duration' => 'integer',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(HRApplication::class, 'application_id');
    }

    public function hr(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hr_id');
    }

    public function isUpcoming(): bool
    {
        return $this->status === 'scheduled' && $this->scheduled_at?->isFuture();
    }

    public function markCompleted(?string $feedback = null): void
    {
        $this->forceFill([
            'status' => 'completed',
            'feedback' => $feedback ?? $this->feedback,
        ])->save();
    }
}
