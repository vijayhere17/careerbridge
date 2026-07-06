<?php

namespace Database\Factories;

use App\Models\MentorProfile;
use App\Models\SavedMentor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SavedMentorFactory extends Factory
{
    protected $model = SavedMentor::class;

    public function definition(): array
    {
        return [
            'candidate_id' => User::factory()->create(['role' => 'seeker'])->id,
            'mentor_id' => MentorProfile::factory(),
        ];
    }
}
