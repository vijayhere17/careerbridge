<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Models\AuthOtp;
use App\Models\RecruiterProfile;
use App\Services\RecruiterOnboardingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class RecruiterOnboardingController extends RecruiterBaseController
{
    public function __construct(private RecruiterOnboardingService $onboarding)
    {
    }

    public function status(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request, false);
        if ($error) {
            return $error;
        }

        return $this->success(
            $this->onboarding->statusPayload($user),
            'Recruiter onboarding status retrieved successfully.'
        );
    }

    public function sendEmailOtp(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request, false);
        if ($error) {
            return $error;
        }

        $extra = $this->issueOtp($user->email, 'recruiter_email_verification');

        return $this->success(
            $extra,
            'Email verification OTP sent successfully.'
        );
    }

    public function verifyEmail(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request, false);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        if (! $this->verifyOtp($user->email, 'recruiter_email_verification', (string) $request->input('otp'))) {
            return $this->validationError(['otp' => ['The OTP is invalid or expired.']]);
        }

        $this->onboarding->syncEmailVerification($user, true);
        $user->refresh();

        $payload = $this->onboarding->statusPayload($user);

        if (! ($payload['verified_email'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => 'Email verification could not be saved. Please try again.',
                'data' => $payload,
            ], 500);
        }

        return $this->success($payload, 'Email verified successfully.');
    }

    public function sendMobileOtp(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request, false);
        if ($error) {
            return $error;
        }

        if (! filled($user->mobile)) {
            return $this->validationError(['mobile' => ['Mobile number is required before verification.']]);
        }

        $extra = $this->issueOtp($user->mobile, 'recruiter_mobile_verification');

        return $this->success(
            $extra,
            'Mobile verification OTP sent successfully.'
        );
    }

    public function verifyMobile(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request, false);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        if (! filled($user->mobile)) {
            return $this->validationError(['mobile' => ['Mobile number is required before verification.']]);
        }

        if (! $this->verifyOtp($user->mobile, 'recruiter_mobile_verification', (string) $request->input('otp'))) {
            return $this->validationError(['otp' => ['The OTP is invalid or expired.']]);
        }

        $this->onboarding->syncMobileVerification($user, true);
        $user->refresh();

        $payload = $this->onboarding->statusPayload($user);

        if (! ($payload['verified_mobile'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => 'Mobile verification could not be saved. Please try again.',
                'data' => $payload,
            ], 500);
        }

        return $this->success($payload, 'Mobile verified successfully.');
    }

    public function showProfile(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request, false);
        if ($error) {
            return $error;
        }

        $status = $this->onboarding->statusPayload($user);

        return $this->success([
            'onboarding' => $status,
            'profile' => $status['profile'],
        ], 'Recruiter profile retrieved successfully.');
    }

    public function updateProfile(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request, false);
        if ($error) {
            return $error;
        }

        if (! $this->onboarding->isFullyVerified($user)) {
            return $this->forbidden('Complete email and mobile verification before updating your profile.');
        }

        $profile = $this->onboarding->ensureProfile($user);

        $strict = $request->boolean('save_and_continue');
        $req = $strict ? 'required' : 'nullable';

        $validator = Validator::make($request->all(), [
            'company_name' => "{$req}|string|max:255",
            'recruiter_name' => "{$req}|string|max:255",
            'designation' => "{$req}|string|max:255",
            'about_company' => "{$req}|string|max:5000",
            'company_description' => "{$req}|string|max:10000",
            'industry' => "{$req}|string|max:255",
            'company_size' => "{$req}|string|max:100",
            'website' => "{$req}|string|max:255",
            'email' => "{$req}|email|max:255",
            'phone' => "{$req}|string|max:30",
            'office_address' => "{$req}|string|max:500",
            'city' => "{$req}|string|max:120",
            'state' => "{$req}|string|max:120",
            'country' => "{$req}|string|max:120",
            'pin_code' => "{$req}|string|max:20",
            'linkedin' => 'nullable|string|max:255',
            'facebook' => 'nullable|string|max:255',
            'instagram' => 'nullable|string|max:255',
            'twitter' => 'nullable|string|max:255',
            'company_registration_number' => "{$req}|string|max:120",
            'gst_number' => 'nullable|string|max:120',
            'company_logo' => ($strict && ! $profile->company_logo ? 'required' : 'nullable') . '|image|max:4096',
            'cover_image' => 'nullable|image|max:8192',
            'recruiter_type' => 'nullable|in:' . implode(',', RecruiterProfile::TYPES),
            'save_and_continue' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        unset($data['company_logo'], $data['cover_image'], $data['save_and_continue']);

        $profile->fill($data);

        if ($request->hasFile('company_logo')) {
            if ($profile->company_logo && ! str_starts_with($profile->company_logo, 'http')) {
                Storage::disk('public')->delete($profile->company_logo);
            }
            $profile->company_logo = $request->file('company_logo')->store('recruiter/logos', 'public');
        }

        if ($request->hasFile('cover_image')) {
            if ($profile->cover_image && ! str_starts_with($profile->cover_image, 'http')) {
                Storage::disk('public')->delete($profile->cover_image);
            }
            $profile->cover_image = $request->file('cover_image')->store('recruiter/covers', 'public');
        }

        if ($profile->isRejected()) {
            $profile->approval_status = RecruiterProfile::APPROVAL_PENDING;
            $profile->admin_remarks = null;
            $profile->reviewed_at = null;
        }

        $profile->recalculateCompletion();
        $profile->save();

        $user->forceFill([
            'name' => $profile->recruiter_name ?: $user->name,
            'company' => $profile->company_name,
            'current_role' => $profile->designation,
            'location' => trim(implode(', ', array_filter([
                $profile->city,
                $profile->state,
                $profile->country,
            ]))) ?: $user->location,
            'bio' => $profile->about_company,
            'linkedin' => $profile->linkedin,
            'mobile' => $profile->phone ?: $user->mobile,
        ])->save();

        $status = $this->onboarding->statusPayload($user->fresh());

        return $this->success([
            'onboarding' => $status,
            'profile' => $status['profile'],
        ], 'Recruiter profile saved successfully.');
    }

    public function selectType(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request, false);
        if ($error) {
            return $error;
        }

        if (! $this->onboarding->isFullyVerified($user)) {
            return $this->forbidden('Complete verification before selecting recruiter type.');
        }

        $profile = $this->onboarding->ensureProfile($user);

        if (! $profile->hasCompletedProfile()) {
            return $this->forbidden('Complete your recruiter profile before selecting a type.');
        }

        $validator = Validator::make($request->all(), [
            'recruiter_type' => 'required|in:' . implode(',', RecruiterProfile::TYPES),
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $profile->recruiter_type = $request->input('recruiter_type');
        $profile->recalculateCompletion();

        if ($profile->isRejected() || $profile->isChangesRequested()) {
            $profile->approval_status = RecruiterProfile::APPROVAL_PENDING;
            $profile->admin_remarks = null;
            $profile->rejection_reason = null;
            $profile->required_changes = null;
            $profile->reviewed_at = null;
        }

        if ($this->onboarding->requiresAdminApproval()) {
            $profile->approval_status = RecruiterProfile::APPROVAL_PENDING;
            $profile->submitted_at = now();
            $profile->onboarding_step = 'pending_approval';
        } else {
            $profile->approval_status = RecruiterProfile::APPROVAL_APPROVED;
            $profile->submitted_at = now();
            $profile->reviewed_at = now();
            $profile->onboarding_step = 'complete';
        }

        $profile->save();

        return $this->success(
            $this->onboarding->statusPayload($user->fresh()),
            'Recruiter type saved successfully.'
        );
    }

    public function resubmit(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request, false);
        if ($error) {
            return $error;
        }

        $profile = $this->onboarding->ensureProfile($user);

        if (! $profile->isRejected() && ! $profile->isPending() && ! $profile->isChangesRequested()) {
            return $this->forbidden('Only rejected, changes-requested, or pending profiles can be resubmitted.');
        }

        if (! $this->onboarding->isFullyVerified($user)
            || ! $profile->hasCompletedProfile()
            || ! $profile->hasSelectedType()) {
            return $this->forbidden('Complete verification, profile, and recruiter type before resubmitting.');
        }

        $profile->approval_status = RecruiterProfile::APPROVAL_PENDING;
        $profile->admin_remarks = null;
        $profile->rejection_reason = null;
        $profile->required_changes = null;
        $profile->submitted_at = now();
        $profile->reviewed_at = null;
        $profile->onboarding_step = 'pending_approval';
        $profile->save();

        return $this->success(
            $this->onboarding->statusPayload($user->fresh()),
            'Profile resubmitted for admin approval.'
        );
    }

    public function review(Request $request, int $userId)
    {
        // Keep legacy route; delegate to the Admin review implementation.
        return app(\App\Http\Controllers\Api\Admin\AdminRecruiterController::class)
            ->review($request, $userId);
    }

    private function issueOtp(string $identifier, string $purpose): array
    {
        $code = (string) random_int(100000, 999999);

        AuthOtp::where('email', $identifier)->where('purpose', $purpose)->delete();
        AuthOtp::create([
            'email' => $identifier,
            'purpose' => $purpose,
            'code' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
        ]);

        Log::info("CareerBridge {$purpose} OTP for {$identifier}: {$code}");

        return app()->environment('local') ? ['dev_otp' => $code] : [];
    }

    private function verifyOtp(string $identifier, string $purpose, string $code): bool
    {
        $otp = AuthOtp::where('email', $identifier)->where('purpose', $purpose)->latest()->first();

        if (! $otp || $otp->expires_at->isPast() || ! Hash::check($code, $otp->code)) {
            return false;
        }

        $otp->delete();

        return true;
    }
}
