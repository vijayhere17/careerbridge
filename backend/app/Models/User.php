<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\WithdrawRequest;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public function mentorProfile()
    {
        return $this->hasOne(MentorProfile::class);
    }

    public function savedOpportunities(): HasMany
{
    return $this->hasMany(SavedOpportunity::class);
}

public function wallet(): HasOne
{
    return $this->hasOne(Wallet::class);
}

public function withdrawRequests(): HasMany
{
    return $this->hasMany(WithdrawRequest::class);
}

public function walletTransactions(): HasMany
{
    return $this->hasMany(WalletTransaction::class);
}

public function jobApplications(): HasMany
{
    return $this->hasMany(JobApplication::class);
}



public function reviewsGiven(): HasMany
{
    return $this->hasMany(MentorReview::class, 'user_id');
}

public function opportunities()
{
    return $this->hasMany(RecruiterOpportunity::class);
}

public function reviewsReceived(): HasMany
{
    return $this->hasMany(MentorReview::class, 'mentor_id');
}

public function hrProfile(): HasOne
{
    return $this->hasOne(HRProfile::class);
}

public function hrJobs(): HasMany
{
    return $this->hasMany(HRJob::class, 'hr_id');
}

public function hrApplications(): HasMany
{
    return $this->hasManyThrough(
        HRApplication::class,
        HRJob::class,
        'hr_id',
        'job_id',
        'id',
        'id'
    );
}

public function hrNotes(): HasMany
{
    return $this->hasMany(HRCandidateNote::class, 'hr_id');
}

public function hrInterviews(): HasMany
{
    return $this->hasMany(HRInterview::class, 'hr_id');
}

public function hrActivityLogs(): HasMany
{
    return $this->hasMany(HRActivityLog::class, 'hr_id');
}

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
   protected $fillable = [
    'name',
    'last_name',

    'email',
    'mobile',
    'password',

    'role',
    'api_token',

    'company',
    'current_role',
    'target_roles',

    'location',
    'bio',

    'profile_photo',

    'experience',
    'education',

    'skills',
    'projects',
    'certificates',
    'languages',
    'tags',
    'resume_path',

    'linkedin',
    'github',
    'portfolio',

    'looking_for',
    'hr_preferences',
];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'api_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
{
    return [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',

        'skills' => 'array',
        'projects' => 'array',
        'certificates' => 'array',
        'languages' => 'array',
        'tags' => 'array',
        'looking_for' => 'array',
        'hr_preferences' => 'array',
    ];
}
}
