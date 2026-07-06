<?php

namespace Tests\Feature;

use App\Models\MentorBooking;
use App\Models\MentorProfile;
use App\Models\MentorReview;
use App\Models\MentorService;
use App\Models\SavedMentor;
use App\Models\User;
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
}
