<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'company_website',
        'industry',
        'company_size',
        'company_description',
        'office_location',
        'phone',
        'linkedin',
        'verified',
        'status',
    ];

    protected $casts = [
        'verified' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function logoUrl(): ?string
    {
        if (!$this->company_logo) {
            return null;
        }

        return str_starts_with($this->company_logo, 'http')
            ? $this->company_logo
            : asset('storage/' . ltrim($this->company_logo, '/'));
    }
}
