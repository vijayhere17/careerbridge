<?php

namespace Tests\Feature;

use App\Models\MentorBooking;
use App\Models\MentorProfile;
use App\Models\MentorReview;
use App\Models\MentorService;
use App\Models\SavedMentor;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MentorApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_listing_and_service_endpoint_work(): void
    {
        $mentor = MentorProfile::factory()->create([
            'company' => 'Google',
            'location' => 'Bengaluru',
            'available' => true,
        ]);

        MentorService::factory()->create([
            'mentor_id' => $mentor->id,
            'title' => 'Mock Interview',
            'price' => 1499,
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/mentors');

        $response->assertOk()
            ->assertJsonPath('mentors.0.company', 'Google');

        $response = $this->getJson('/api/mentors/' . $mentor->id . '/services');

        $response->assertOk()
            ->assertJsonPath('services.0.title', 'Mock Interview');
    }

    public function test_candidate_can_save_and_book_a_mentor(): void
    {
        $candidate = User::factory()->create(['role' => 'seeker']);
        $mentor = MentorProfile::factory()->create();
        $service = MentorService::factory()->create([
            'mentor_id' => $mentor->id,
            'status' => 'active',
        ]);

        Sanctum::actingAs($candidate);

        $saveResponse = $this->postJson('/api/mentors/save', ['mentor_id' => $mentor->id]);
        $saveResponse->assertCreated();
        $this->assertDatabaseHas('saved_mentors', [
            'candidate_id' => $candidate->id,
            'mentor_id' => $mentor->id,
        ]);

        $bookingResponse = $this->postJson('/api/bookings', [
            'mentor_id' => $mentor->id,
            'service_id' => $service->id,
            'date' => '2026-07-10',
            'time' => '03:00 PM',
            'requirements' => 'Need product sense prep',
            'amount' => 1499,
        ]);

        $bookingResponse->assertCreated();
        $this->assertDatabaseHas('mentor_bookings', [
            'candidate_id' => $candidate->id,
            'mentor_id' => $mentor->id,
            'service_id' => $service->id,
        ]);

        $bookingsResponse = $this->getJson('/api/bookings');
        $bookingsResponse->assertOk();
    }

    public function test_mentor_dashboard_returns_database_backed_metrics(): void
    {
        $mentorUser = User::factory()->create([
            'role' => 'mentor',
            'api_token' => 'mentor-dashboard-token',
        ]);

        $candidate = User::factory()->create([
            'role' => 'seeker',
            'name' => 'Aarav Candidate',
        ]);

        $mentor = MentorProfile::factory()->create([
            'user_id' => $mentorUser->id,
            'company' => 'Google',
            'designation' => 'Product Lead',
            'verified' => true,
            'available' => true,
        ]);

        $service = MentorService::factory()->create([
            'mentor_id' => $mentor->id,
            'title' => 'Mock Interview',
            'price' => 1499,
            'duration' => 60,
            'session_type' => 'video',
        ]);

        $confirmedBooking = MentorBooking::create([
            'mentor_id' => $mentor->id,
            'candidate_id' => $candidate->id,
            'service_id' => $service->id,
            'date' => now()->toDateString(),
            'time' => '07:00 PM',
            'amount' => 1499,
            'status' => 'confirmed',
            'payment_status' => 'escrow',
        ]);

        MentorBooking::create([
            'mentor_id' => $mentor->id,
            'candidate_id' => $candidate->id,
            'service_id' => $service->id,
            'date' => now()->addDay()->toDateString(),
            'time' => '05:00 PM',
            'amount' => 999,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        MentorReview::create([
            'booking_id' => $confirmedBooking->id,
            'mentor_id' => $mentor->id,
            'user_id' => $candidate->id,
            'rating' => 5,
            'comment' => 'Very helpful session.',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        Wallet::create([
            'user_id' => $mentorUser->id,
            'balance' => 2500,
        ]);

        WalletTransaction::create([
            'user_id' => $mentorUser->id,
            'type' => 'credit',
            'category' => 'session',
            'title' => 'Session payout',
            'amount' => 1499,
            'status' => 'success',
            'reference' => 'TEST-DASHBOARD-001',
        ]);

        $response = $this
            ->withHeader('Authorization', 'Bearer mentor-dashboard-token')
            ->getJson('/api/mentor/dashboard');

        $response->assertOk()
            ->assertJsonPath('mentor.name', $mentorUser->name)
            ->assertJsonPath('mentor.company', 'Google')
            ->assertJsonPath('mentor.rating', 5)
            ->assertJsonPath('stats.today_sessions', 1)
            ->assertJsonPath('stats.pending_requests', 1)
            ->assertJsonPath('stats.wallet_balance', 2500)
            ->assertJsonPath('stats.monthly_earnings', 1499)
            ->assertJsonPath('upcoming_sessions.0.candidateName', 'Aarav Candidate')
            ->assertJsonPath('pending_requests.0.service', 'Mock Interview')
            ->assertJsonPath('recent_reviews.0.comment', 'Very helpful session.');
    }
}
