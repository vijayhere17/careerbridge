<?php

namespace Database\Seeders;

use App\Models\Mentor;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        User::updateOrCreate(
            ['email' => 'hr@gmail.com'],
            [
                'name' => 'HR Test',
                'mobile' => '9999999999',
                'password' => Hash::make('12345678'),
                'role' => 'opportunity_provider',
                'email_verified_at' => now(),
            ]
        );

        Mentor::truncate();

        Mentor::create([
            'id' => 'aarav-mehta',
            'name' => 'Aarav Mehta',
            'initials' => 'AM',
            'avatar_color' => '#2563EB',
            'role' => 'Senior Software Engineer',
            'company' => 'Google',
            'company_slug' => 'google',
            'experience' => 7,
            'location' => 'Bengaluru, India',
            'languages' => ['English', 'Hindi'],
            'bio' => 'I help engineers crack FAANG interviews. Ex-Microsoft, now at Google working on Search infrastructure.',
            'skills' => ['DSA', 'System Design', 'Distributed Systems', 'Go', 'Python'],
            'rating' => 4.9,
            'reviews' => 184,
            'sessions' => 412,
            'price_per_session' => 49,
            'response_time' => 'Within 2 hours',
            'available' => true,
            'services' => [
                ['id' => 'mock-coding', 'title' => 'Mock Coding Interview', 'duration' => '60 min', 'price' => 49, 'type' => 'Video Call'],
                ['id' => 'system-design', 'title' => 'System Design Deep Dive', 'duration' => '75 min', 'price' => 79, 'type' => 'Video Call'],
            ],
            'journey' => [
                ['year' => '2024', 'title' => 'Senior SWE', 'company' => 'Google', 'description' => 'Leading a team on Search ranking.'],
                ['year' => '2021', 'title' => 'SWE II', 'company' => 'Google', 'description' => 'Joined Search infra team after L4 transfer.'],
            ],
            'achievements' => ['Google Spot Bonus x3', 'ICPC Regionalist 2016'],
            'certifications' => ['AWS Solutions Architect'],
            'testimonials' => [
                ['name' => 'Priya R.', 'role' => 'SDE @ Amazon', 'text' => 'Aarav’s mock interviews felt harder than the real thing.', 'rating' => 5],
            ],
            'faqs' => [
                ['q' => 'Do you guarantee a referral?', 'a' => 'Referrals depend on readiness and fit.'],
            ],
        ]);

        Mentor::create([
            'id' => 'sofia-park',
            'name' => 'Sofia Park',
            'initials' => 'SP',
            'avatar_color' => '#10B981',
            'role' => 'Staff Frontend Engineer',
            'company' => 'Meta',
            'company_slug' => 'meta',
            'experience' => 9,
            'location' => 'London, UK',
            'languages' => ['English', 'Korean'],
            'bio' => 'Staff engineer on Instagram Web. I help frontend engineers level up with product architecture and performance.',
            'skills' => ['React', 'TypeScript', 'Performance', 'GraphQL'],
            'rating' => 5.0,
            'reviews' => 142,
            'sessions' => 268,
            'price_per_session' => 89,
            'response_time' => 'Within 4 hours',
            'available' => true,
            'services' => [
                ['id' => 'product-arch', 'title' => 'Product Architecture Mock', 'duration' => '60 min', 'price' => 89, 'type' => 'Video Call'],
            ],
            'journey' => [
                ['year' => '2023', 'title' => 'Staff Engineer', 'company' => 'Meta', 'description' => 'Promoted to E6 after leading Reels rewrite.'],
            ],
            'achievements' => ['Meta Above & Beyond Award 2023'],
            'certifications' => [],
            'testimonials' => [
                ['name' => 'James T.', 'role' => 'FE @ Shopify', 'text' => 'Sofia explained Meta’s product architecture rubric better than anyone.', 'rating' => 5],
            ],
            'faqs' => [
                ['q' => 'US timezone OK?', 'a' => 'I take two evening UK slots that work for PT mornings.'],
            ],
        ]);
    }
}
