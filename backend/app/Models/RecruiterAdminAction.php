<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecruiterAdminAction extends Model
{
    public const ACTION_APPROVE = 'approve';

    public const ACTION_REJECT = 'reject';

    public const ACTION_REQUEST_CHANGES = 'request_changes';

    public const ACTION_SUSPEND = 'suspend';

    public const ACTION_REACTIVATE = 'reactivate';

    public const ACTION_INTERNAL_NOTE = 'internal_note';

    protected $fillable = [
        'recruiter_profile_id',
        'admin_id',
        'action',
        'from_status',
        'to_status',
        'reason',
        'notes',
        'required_changes',
        'is_internal_note',
    ];

    protected function casts(): array
    {
        return [
            'is_internal_note' => 'boolean',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(RecruiterProfile::class, 'recruiter_profile_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
