<?php

namespace Database\Factories;

use App\Models\MentorProfile;
use App\Models\MentorService;
use Illuminate\Database\Eloquent\Factories\Factory;

class MentorServiceFactory extends Factory
{
    protected $model = MentorService::class;

    public function definition(): array
    {
        return [
            'mentor_id' => MentorProfile::factory(),
            'title' => 'Mock Interview',
            'description' => 'Mock interview session',
            'price' => 1499,
            'duration' => 60,
            'session_type' => 'Video Call',
            'status' => 'active',
        ];
    }
}
