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
        'hr',
        'final',
        'offer',
        'joined',
        'rejected',
    ];

    protected $fillable = [
        'job_id',
        'candidate_id',
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
        'interview_date' => 'datetime',
        'offer_salary' => 'decimal:2',
        'joined_date' => 'date',
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

    public function moveToStage(string $stage): void
    {
        $payload = ['current_stage' => $stage];

        if ($stage === 'joined' && !$this->joined_date) {
            $payload['joined_date'] = now()->toDateString();
        }

        if ($stage === 'offer' && $this->offer_status === 'none') {
            $payload['offer_status'] = 'pending';
        }

        $this->forceFill($payload)->save();
    }

    public function isRejected(): bool
    {
        return $this->current_stage === 'rejected';
    }
}
