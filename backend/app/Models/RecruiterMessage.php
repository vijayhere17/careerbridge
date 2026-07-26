<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecruiterMessage extends Model
{
    protected $fillable = [
        'recruiter_application_id',
        'sender_id',
        'receiver_id',
        'body',
        'attachment_path',
        'attachment_name',
        'attachment_mime',
        'is_read',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(RecruiterApplication::class, 'recruiter_application_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function attachmentUrl(): ?string
    {
        if (! $this->attachment_path) {
            return null;
        }

        return str_starts_with($this->attachment_path, 'http')
            ? $this->attachment_path
            : asset('storage/' . ltrim($this->attachment_path, '/'));
    }
}
