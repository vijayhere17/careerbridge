<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HRApplicationTimeline extends Model
{
    use HasFactory;

    protected $table = 'hr_application_timelines';

    protected $fillable = [
        'application_id',
        'hr_id',
        'event',
        'from_stage',
        'to_stage',
        'description',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(HRApplication::class, 'application_id');
    }

    public function hr(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hr_id');
    }

    public static function record(
        int $applicationId,
        string $event,
        ?int $hrId = null,
        ?string $from = null,
        ?string $to = null,
        ?string $description = null,
        ?array $meta = null
    ): self {
        return self::create([
            'application_id' => $applicationId,
            'hr_id' => $hrId,
            'event' => $event,
            'from_stage' => $from,
            'to_stage' => $to,
            'description' => $description,
            'meta' => $meta,
        ]);
    }
}
