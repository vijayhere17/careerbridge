<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MentorProfile;
use App\Models\MentorService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MentorProfileSetupController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken()
            ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    public function store(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 401);
        }

        if ($user->role !== 'mentor') {
            return response()->json([
                'message' => 'Only mentors can complete mentor profile setup.'
            ], 403);
        }

        $request->merge([
            'skills' => $this->decodeArray($request->skills),
            'languages' => $this->decodeArray($request->languages),
            'services' => $this->decodeArray($request->services),
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'mobile' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:255',

            'company' => 'required|string|max:255',
            'designation' => 'required|string|max:255',
            'industry' => 'required|string|max:255',
            'experience' => 'required|string|max:100',
            'education' => 'nullable|string|max:255',
            'bio' => 'required|string|max:500',

            'skills' => 'required|array|min:1',
            'skills.*' => 'required|string|max:100',

            'languages' => 'nullable|array',
            'languages.*' => 'string|max:100',

            'services' => 'nullable|array',
            'services.*' => 'string|max:150',

            'linkedin' => 'nullable|string|max:255',
            'portfolio' => 'nullable|string|max:255',
            'github' => 'nullable|string|max:255',
            'introVideo' => 'nullable|string|max:255',

            'profilePhoto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        DB::transaction(function () use ($request, $validated, $user) {

            $profilePhoto = $user->mentorProfile?->profile_photo;

            if ($request->hasFile('profilePhoto')) {
                if (
                    $profilePhoto &&
                    Storage::disk('public')->exists($profilePhoto)
                ) {
                    Storage::disk('public')->delete($profilePhoto);
                }

                $profilePhoto = $request
                    ->file('profilePhoto')
                    ->store('mentor_profiles', 'public');
            }

            $experienceMap = [
    '0-1 years' => 1,
    '1-3 years' => 3,
    '3-5 years' => 5,
    '5-10 years' => 10,
    '10+ years' => 10,
];

$experienceYears = $experienceMap[$validated['experience']] ?? 0;

$user->update([
    'name' => $validated['name'],
    'mobile' => $validated['mobile'] ?? null,
    'location' => $validated['location'] ?? null,
    'company' => $validated['company'],
    'current_role' => $validated['designation'],
    'experience' => $experienceYears,
    'education' => $validated['education'] ?? null,
    'bio' => $validated['bio'],
    'linkedin' => $validated['linkedin'] ?? null,
    'portfolio' => $validated['portfolio'] ?? null,
    'github' => $validated['github'] ?? null,
]);

$mentor = MentorProfile::updateOrCreate(
                [
                    'user_id' => $user->id,
                ],
                [
                    'company' => $validated['company'],
                    'designation' => $validated['designation'],
                    'industry' => $validated['industry'],
                    'experience' => $experienceYears,
                    'location' => $validated['location'] ?? null,
                    'bio' => $validated['bio'],
                    'verified' => false,
                    'onboarding_status' => 'under_review',
                    'available' => false,
                    'profile_photo' => $profilePhoto,
                ]
            );

            $mentor->skills()->delete();

            foreach ($validated['skills'] as $skill) {
                $mentor->skills()->create([
                    'skill' => $skill,
                ]);
            }

            $mentor->languages()->delete();

            foreach ($validated['languages'] ?? [] as $language) {
                $mentor->languages()->create([
                    'language' => $language,
                ]);
            }

            $mentor->services()->delete();

            foreach ($validated['services'] ?? [] as $service) {
                MentorService::create([
                    'mentor_id' => $mentor->id,
                    'title' => $service,
                    'description' => null,
                    'price' => 0,
                    'duration' => 30,
                    'session_type' => 'video',
                    'status' => 'inactive',
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Mentor profile submitted for review.',
            'mentor_onboarding' => [
                'has_profile' => true,
                'status' => 'under_review',
                'verified' => false,
            ],
        ]);
    }

    private function decodeArray($value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (!$value) {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }
}