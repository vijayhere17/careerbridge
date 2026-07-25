<?php

namespace App\Services;

use App\Models\RecruiterProfile;
use App\Models\User;

class RecruiterOnboardingService
{
    public function ensureProfile(User $user): RecruiterProfile
    {
        return RecruiterProfile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'recruiter_name' => $user->name,
                'email' => $user->email,
                'phone' => $user->mobile,
                'approval_status' => RecruiterProfile::APPROVAL_PENDING,
                'onboarding_step' => 'verification',
                'profile_completion' => 0,
            ]
        );
    }

    public function syncEmailVerification(User $user, bool $verified = true): void
    {
        $user->forceFill([
            'verified_email' => $verified,
            'email_verified_at' => $verified ? ($user->email_verified_at ?? now()) : null,
        ])->save();
    }

    public function syncMobileVerification(User $user, bool $verified = true): void
    {
        $user->forceFill([
            'verified_mobile' => $verified,
            'mobile_verified_at' => $verified ? now() : null,
        ])->save();
    }

    public function isEmailVerified(User $user): bool
    {
        return (bool) $user->verified_email || filled($user->email_verified_at);
    }

    public function isMobileVerified(User $user): bool
    {
        return (bool) $user->verified_mobile || filled($user->mobile_verified_at);
    }

    public function isFullyVerified(User $user): bool
    {
        return $this->isEmailVerified($user) && $this->isMobileVerified($user);
    }

    public function requiresAdminApproval(): bool
    {
        return (bool) config('recruiter.require_admin_approval', true);
    }

    public function refreshOnboardingStep(User $user, ?RecruiterProfile $profile = null): RecruiterProfile
    {
        $profile = $profile ?? $this->ensureProfile($user);
        $profile->recalculateCompletion();

        // Already-approved recruiters keep dashboard access (including grandfathered accounts).
        if ($profile->isApproved() && $profile->hasSelectedType() && $this->isFullyVerified($user)) {
            $profile->onboarding_step = 'complete';
            $profile->save();

            return $profile->fresh();
        }

        if (! $this->isFullyVerified($user)) {
            $profile->onboarding_step = 'verification';
        } elseif (! $profile->hasCompletedProfile()) {
            $profile->onboarding_step = 'profile';
        } elseif (! $profile->hasSelectedType()) {
            $profile->onboarding_step = 'type';
        } elseif ($this->requiresAdminApproval() && ! $profile->isApproved()) {
            $profile->onboarding_step = $profile->isRejected() ? 'rejected' : 'pending_approval';
        } else {
            if (! $this->requiresAdminApproval() && $profile->isPending()) {
                $profile->approval_status = RecruiterProfile::APPROVAL_APPROVED;
                $profile->reviewed_at = now();
            }
            $profile->onboarding_step = 'complete';
        }

        $profile->save();

        return $profile->fresh();
    }

    public function canAccessDashboard(User $user): bool
    {
        if (in_array($user->role, ['admin'], true)) {
            return true;
        }

        if ($user->role !== 'opportunity_provider') {
            return false;
        }

        $profile = $this->ensureProfile($user);
        $profile = $this->refreshOnboardingStep($user, $profile);

        if ($profile->isApproved() && $profile->onboarding_step === 'complete') {
            return true;
        }

        if (! $this->isFullyVerified($user)) {
            return false;
        }

        if (! $profile->hasCompletedProfile() || ! $profile->hasSelectedType()) {
            return false;
        }

        if ($this->requiresAdminApproval() && ! $profile->isApproved()) {
            return false;
        }

        return true;
    }

    public function canPostOpportunities(User $user): bool
    {
        return $this->canAccessDashboard($user);
    }

    /**
     * @return array<string, mixed>
     */
    public function statusPayload(User $user): array
    {
        $profile = $this->ensureProfile($user);
        $profile = $this->refreshOnboardingStep($user, $profile);

        $emailVerified = $this->isEmailVerified($user);
        $mobileVerified = $this->isMobileVerified($user);
        $requireApproval = $this->requiresAdminApproval();
        $canAccess = $this->canAccessDashboard($user);

        $nextStep = match (true) {
            ! $emailVerified || ! $mobileVerified => 'verification',
            ! $profile->hasCompletedProfile() => 'profile',
            ! $profile->hasSelectedType() => 'type',
            $requireApproval && $profile->isRejected() => 'rejected',
            $requireApproval && ! $profile->isApproved() => 'pending_approval',
            default => 'complete',
        };

        return [
            'role' => $user->role,
            'verified_email' => $emailVerified,
            'verified_mobile' => $mobileVerified,
            'verification_complete' => $emailVerified && $mobileVerified,
            'profile_complete' => $profile->hasCompletedProfile(),
            'type_selected' => $profile->hasSelectedType(),
            'recruiter_type' => $profile->recruiter_type,
            'approval_status' => $profile->approval_status,
            'admin_remarks' => $profile->admin_remarks,
            'require_admin_approval' => $requireApproval,
            'profile_completion' => $profile->profile_completion,
            'onboarding_step' => $profile->onboarding_step,
            'next_step' => $nextStep,
            'can_access_dashboard' => $canAccess,
            'can_post_opportunities' => $canAccess,
            'available_types' => RecruiterProfile::TYPES,
            'profile' => $this->transformProfile($profile),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function transformProfile(RecruiterProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'company_name' => $profile->company_name,
            'company_logo' => $profile->logoUrl(),
            'cover_image' => $profile->coverUrl(),
            'recruiter_name' => $profile->recruiter_name,
            'designation' => $profile->designation,
            'about_company' => $profile->about_company,
            'company_description' => $profile->company_description,
            'industry' => $profile->industry,
            'company_size' => $profile->company_size,
            'website' => $profile->website,
            'email' => $profile->email,
            'phone' => $profile->phone,
            'office_address' => $profile->office_address,
            'city' => $profile->city,
            'state' => $profile->state,
            'country' => $profile->country,
            'pin_code' => $profile->pin_code,
            'linkedin' => $profile->linkedin,
            'facebook' => $profile->facebook,
            'instagram' => $profile->instagram,
            'twitter' => $profile->twitter,
            'company_registration_number' => $profile->company_registration_number,
            'gst_number' => $profile->gst_number,
            'recruiter_type' => $profile->recruiter_type,
            'approval_status' => $profile->approval_status,
            'admin_remarks' => $profile->admin_remarks,
            'profile_completion' => $profile->profile_completion,
            'onboarding_step' => $profile->onboarding_step,
            'submitted_at' => $profile->submitted_at?->toIso8601String(),
            'reviewed_at' => $profile->reviewed_at?->toIso8601String(),
        ];
    }
}
