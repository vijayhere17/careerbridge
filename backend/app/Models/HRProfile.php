<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HRProfile extends Model
{
    use HasFactory;

    protected $table = 'hr_profiles';

    protected $fillable = [
        'user_id',
        'company_name',
        'designation',
        'department',
        'company_logo',
        'company_cover',
        'company_website',
        'industry',
        'company_size',
        'company_description',
        'culture',
        'benefits',
        'office_location',
        'locations',
        'phone',
        'linkedin',
        'social_links',
        'verified',
        'status',
    ];

    protected $casts = [
        'verified' => 'boolean',
        'locations' => 'array',
        'social_links' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function mediaUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return str_starts_with($path, 'http')
            ? $path
            : asset('storage/' . ltrim($path, '/'));
    }

    public function logoUrl(): ?string
    {
        return $this->mediaUrl($this->company_logo);
    }

    public function coverUrl(): ?string
    {
        return $this->mediaUrl($this->company_cover);
    }
}
