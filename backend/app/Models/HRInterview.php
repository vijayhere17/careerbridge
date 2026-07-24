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
        'panel',
        'interview_type',
        'meeting_link',
        'scheduled_at',
        'duration',
        'status',
        'feedback',
        'notes',
        'rating',
        'result',
        'completed_at',
        'cancelled_at',
        'rescheduled_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'duration' => 'integer',
        'panel' => 'array',
        'rating' => 'integer',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'rescheduled_at' => 'datetime',
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

    public function markCompleted(?string $feedback = null, ?int $rating = null, ?string $result = null): void
    {
        $this->forceFill([
            'status' => 'completed',
            'feedback' => $feedback ?? $this->feedback,
            'rating' => $rating ?? $this->rating,
            'result' => $result ?? $this->result,
            'completed_at' => now(),
        ])->save();
    }

    public function cancel(?string $notes = null): void
    {
        $this->forceFill([
            'status' => 'cancelled',
            'notes' => $notes ?? $this->notes,
            'cancelled_at' => now(),
        ])->save();
    }

    public function reschedule(\DateTimeInterface|string $when): void
    {
        $this->forceFill([
            'scheduled_at' => $when,
            'status' => 'scheduled',
            'rescheduled_at' => now(),
            'cancelled_at' => null,
            'completed_at' => null,
        ])->save();
    }
}
