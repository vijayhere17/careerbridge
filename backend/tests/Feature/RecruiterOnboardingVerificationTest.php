<?php

namespace Tests\Feature;

use App\Models\AuthOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RecruiterOnboardingVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_mobile_otp_verify_persists_and_returns_updated_status(): void
    {
        $user = User::factory()->create([
            'role' => 'opportunity_provider',
            'email' => 'recruiter@example.com',
            'mobile' => '9876543210',
            'api_token' => 'recruiter-test-token',
            'verified_email' => true,
            'email_verified_at' => now(),
            'verified_mobile' => false,
            'mobile_verified_at' => null,
        ]);

        AuthOtp::create([
            'email' => $user->mobile,
            'purpose' => 'recruiter_mobile_verification',
            'code' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(10),
        ]);

        $verify = $this->withHeader('Authorization', 'Bearer recruiter-test-token')
            ->postJson('/api/recruiter/onboarding/mobile/verify', ['otp' => '123456']);

        $verify->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.verified_mobile', true)
            ->assertJsonPath('data.verified_email', true)
            ->assertJsonPath('data.verification_complete', true)
            ->assertJsonPath('data.next_step', 'profile');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'verified_mobile' => 1,
        ]);

        $this->assertNotNull($user->fresh()->mobile_verified_at);

        $status = $this->withHeader('Authorization', 'Bearer recruiter-test-token')
            ->getJson('/api/recruiter/onboarding/status');

        $status->assertOk()
            ->assertJsonPath('data.verified_mobile', true)
            ->assertJsonPath('data.verification_complete', true)
            ->assertJsonPath('data.next_step', 'profile');
    }

    public function test_email_otp_verify_persists_and_returns_updated_status(): void
    {
        $user = User::factory()->create([
            'role' => 'opportunity_provider',
            'email' => 'recruiter2@example.com',
            'mobile' => '9876543211',
            'api_token' => 'recruiter-email-token',
            'verified_email' => false,
            'email_verified_at' => null,
            'verified_mobile' => false,
        ]);

        AuthOtp::create([
            'email' => $user->email,
            'purpose' => 'recruiter_email_verification',
            'code' => Hash::make('654321'),
            'expires_at' => now()->addMinutes(10),
        ]);

        $verify = $this->withHeader('Authorization', 'Bearer recruiter-email-token')
            ->postJson('/api/recruiter/onboarding/email/verify', ['otp' => '654321']);

        $verify->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.verified_email', true);

        $status = $this->withHeader('Authorization', 'Bearer recruiter-email-token')
            ->getJson('/api/recruiter/onboarding/status');

        $status->assertOk()
            ->assertJsonPath('data.verified_email', true);
    }
}
