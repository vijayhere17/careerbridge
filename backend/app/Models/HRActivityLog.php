<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HRActivityLog extends Model
{
    use HasFactory;

    protected $table = 'hr_activity_logs';

    protected $fillable = [
        'hr_id',
        'action',
        'module',
        'description',
    ];

    public function hr(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hr_id');
    }

    public static function record(int $hrId, string $action, string $module, ?string $description = null): self
    {
        return self::create([
            'hr_id' => $hrId,
            'action' => $action,
            'module' => $module,
            'description' => $description,
        ]);
    }
}
