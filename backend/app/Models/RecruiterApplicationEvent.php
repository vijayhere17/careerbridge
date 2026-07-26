<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecruiterApplicationEvent extends Model
{
    protected $fillable = [
        'recruiter_application_id',
        'actor_id',
        'event',
        'from_status',
        'to_status',
        'note',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(RecruiterApplication::class, 'recruiter_application_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
