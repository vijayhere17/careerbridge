<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Opportunity extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category',
        'company',
        'company_logo',
        'title',
        'role',
        'industry',
        'domain',
        'location',
        'work_type',
        'experience',
        'salary',
       'employment_type',
'duration',
'ppo_chance',
'description',
        'interview_process',
        'provider_name',
        'provider_type',
        'provider_verified',
        'contact_price',
        'phone',
        'email',
        'whatsapp',
        'linkedin',
        'apply_url',
        'verified',
        'featured',
        'active',
    ];

    protected $casts = [
    'verified' => 'boolean',
    'featured' => 'boolean',
    'active' => 'boolean',
    'provider_verified' => 'boolean',
    'ppo_chance' => 'boolean',
];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function skills(): HasMany
    {
        return $this->hasMany(OpportunitySkill::class);
    }

    public function benefits(): HasMany
    {
        return $this->hasMany(OpportunityBenefit::class);
    }

    public function savedBy(): HasMany
{
    return $this->hasMany(SavedOpportunity::class);
}

public function applications(): HasMany
{
    return $this->hasMany(JobApplication::class);
}
}