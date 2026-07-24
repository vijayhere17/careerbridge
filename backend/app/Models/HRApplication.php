<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HRApplication extends Model
{
    use HasFactory;

    protected $table = 'hr_applications';

    public const STAGES = [
        'applied',
        'screening',
        'technical',
        'hr_round',
        'manager_round',
        'final_interview',
        'offer',
        'joined',
        'rejected',
    ];

    public const STAGE_LABELS = [
        'applied' => 'Applied',
        'screening' => 'Screening',
        'technical' => 'Technical',
        'hr_round' => 'HR Round',
        'manager_round' => 'Manager Round',
        'final_interview' => 'Final Interview',
        'offer' => 'Offer',
        'joined' => 'Joined',
        'rejected' => 'Rejected',
    ];

    protected $fillable = [
        'job_id',
        'candidate_id',
        'source',
        'expected_salary',
        'resume_path',
        'applied_at',
        'shortlisted_at',
        'rejected_at',
        'offer_sent_at',
        'stage_changed_at',
        'stage_order',
        'current_stage',
        'rating',
        'interview_date',
        'interview_mode',
        'interview_link',
        'interviewer_notes',
        'hr_notes',
        'offer_salary',
        'offer_status',
        'joined_date',
        'rejected_reason',
    ];

    protected $casts = [
        'rating' => 'integer',
        'expected_salary' => 'decimal:2',
        'interview_date' => 'datetime',
        'offer_salary' => 'decimal:2',
        'joined_date' => 'date',
        'applied_at' => 'datetime',
        'shortlisted_at' => 'datetime',
        'rejected_at' => 'datetime',
        'offer_sent_at' => 'datetime',
        'stage_changed_at' => 'datetime',
        'stage_order' => 'integer',
    ];

    public function job(): BelongsTo
    {
        return $this->belongsTo(HRJob::class, 'job_id');
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_id');
    }

    public function interviews(): HasMany
    {
        return $this->hasMany(HRInterview::class, 'application_id');
    }

    public function timeline(): HasMany
    {
        return $this->hasMany(HRApplicationTimeline::class, 'application_id')->latest();
    }

    public function moveToStage(string $stage, ?int $hrId = null, ?string $reason = null): void
    {
        $from = $this->current_stage;
        $payload = [
            'current_stage' => $stage,
            'stage_changed_at' => now(),
        ];

        if ($stage === 'joined' && !$this->joined_date) {
            $payload['joined_date'] = now()->toDateString();
        }

        if ($stage === 'offer') {
            if ($this->offer_status === 'none') {
                $payload['offer_status'] = 'pending';
            }
            if (!$this->offer_sent_at) {
                $payload['offer_sent_at'] = now();
            }
        }

        if ($stage === 'screening' || $stage === 'technical' || $stage === 'hr_round') {
            if (!$this->shortlisted_at && $from === 'applied') {
                $payload['shortlisted_at'] = now();
            }
        }

        if ($stage === 'rejected') {
            $payload['rejected_at'] = now();
            if ($reason) {
                $payload['rejected_reason'] = $reason;
            }
        }

        $this->forceFill($payload)->save();

        HRApplicationTimeline::record(
            $this->id,
            'stage_changed',
            $hrId,
            $from,
            $stage,
            $reason ?: "Moved from {$from} to {$stage}"
        );
    }

    public function resumeUrl(): ?string
    {
        $path = $this->resume_path ?: $this->candidate?->resume_path;
        if (!$path) {
            return null;
        }

        return str_starts_with($path, 'http')
            ? $path
            : asset('storage/' . ltrim($path, '/'));
    }

    public function isRejected(): bool
    {
        return $this->current_stage === 'rejected';
    }
}
