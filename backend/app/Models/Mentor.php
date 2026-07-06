<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mentor extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'initials',
        'avatar_color',
        'role',
        'company',
        'company_slug',
        'experience',
        'location',
        'languages',
        'bio',
        'skills',
        'rating',
        'reviews',
        'sessions',
        'price_per_session',
        'response_time',
        'available',
        'services',
        'journey',
        'achievements',
        'certifications',
        'testimonials',
        'faqs',
    ];

    protected $casts = [
        'languages' => 'array',
        'skills' => 'array',
        'services' => 'array',
        'journey' => 'array',
        'achievements' => 'array',
        'certifications' => 'array',
        'testimonials' => 'array',
        'faqs' => 'array',
        'available' => 'boolean',
        'rating' => 'decimal:2',
    ];
}
