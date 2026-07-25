<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecruiterProfile extends Model
{
    use HasFactory;

    public const APPROVAL_PENDING = 'Pending';
    public const APPROVAL_APPROVED = 'Approved';
    public const APPROVAL_REJECTED = 'Rejected';

    public const TYPES = [
        'company_recruiter',
        'hr_agency',
        'startup',
        'consultancy',
        'individual_recruiter',
    ];

    protected $fillable = [
        'user_id',
        'company_name',
        'company_logo',
        'recruiter_name',
        'designation',
        'about_company',
        'company_description',
        'industry',
        'company_size',
        'website',
        'email',
        'phone',
        'office_address',
        'city',
        'state',
        'country',
        'pin_code',
        'linkedin',
        'facebook',
        'instagram',
        'twitter',
        'company_registration_number',
        'gst_number',
        'recruiter_type',
        'approval_status',
        'admin_remarks',
        'submitted_at',
        'reviewed_at',
        'profile_completion',
        'onboarding_step',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'profile_completion' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function logoUrl(): ?string
    {
        if (! $this->company_logo) {
            return null;
        }

        return str_starts_with($this->company_logo, 'http')
            ? $this->company_logo
            : asset('storage/' . ltrim($this->company_logo, '/'));
    }

    public function isApproved(): bool
    {
        return $this->approval_status === self::APPROVAL_APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->approval_status === self::APPROVAL_REJECTED;
    }

    public function isPending(): bool
    {
        return $this->approval_status === self::APPROVAL_PENDING;
    }

    public function hasCompletedProfile(): bool
    {
        foreach (self::requiredProfileFields() as $field) {
            if (! filled($this->{$field})) {
                return false;
            }
        }

        return true;
    }

    public function hasSelectedType(): bool
    {
        return filled($this->recruiter_type) && in_array($this->recruiter_type, self::TYPES, true);
    }

    /**
     * Fields required to finish the company profile step (before type selection).
     *
     * @return array<int, string>
     */
    public static function requiredProfileFields(): array
    {
        return [
            'company_name',
            'recruiter_name',
            'designation',
            'about_company',
            'company_description',
            'industry',
            'company_size',
            'website',
            'email',
            'phone',
            'office_address',
            'city',
            'state',
            'country',
            'pin_code',
            'linkedin',
            'company_registration_number',
            'company_logo',
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function completionFields(): array
    {
        return array_merge(self::requiredProfileFields(), ['recruiter_type']);
    }

    public function recalculateCompletion(): int
    {
        $fields = self::completionFields();
        $filled = 0;

        foreach ($fields as $field) {
            if (filled($this->{$field})) {
                $filled++;
            }
        }

        $percent = (int) round(($filled / max(count($fields), 1)) * 100);
        $this->profile_completion = min(100, $percent);

        return $this->profile_completion;
    }
}
