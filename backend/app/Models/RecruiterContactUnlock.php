<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecruiterContactUnlock extends Model
{
    protected $fillable = [
        'recruiter_id',
        'candidate_id',
        'recruiter_opportunity_id',
        'recruiter_application_id',
        'amount',
        'status',
        'unlocked_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'unlocked_at' => 'datetime',
    ];

    public function recruiter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recruiter_id');
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_id');
    }

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(RecruiterOpportunity::class, 'recruiter_opportunity_id');
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(RecruiterApplication::class, 'recruiter_application_id');
    }
}
