<?php

namespace Database\Factories;

use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MentorProfileFactory extends Factory
{
    protected $model = MentorProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->create(['role' => 'mentor'])->id,
            'company' => $this->faker->company(),
            'designation' => 'Senior Engineer',
            'industry' => 'Technology',
            'experience' => 8,
            'location' => $this->faker->city(),
            'bio' => $this->faker->paragraph(),
            'rating' => 4.8,
            'review_count' => 10,
            'session_count' => 50,
            'verified' => true,
            'available' => true,
        ];
    }
}
