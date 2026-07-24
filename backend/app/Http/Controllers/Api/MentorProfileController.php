<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class MentorProfileController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken()
            ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    public function show(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 401);
        }

        if ($user->role !== 'mentor') {
            return response()->json([
                'message' => 'Mentor access only.'
            ], 403);
        }

        $mentor = $user->mentorProfile()
            ->with([
                'skills',
                'languages',
                'services',
                'availabilities',
                'reviews.user',
            ])
            ->first();

        if (!$mentor) {
            return response()->json([
                'message' => 'Mentor profile not found.'
            ], 404);
        }

        return response()->json([
            'mentor' => [
                'id' => $mentor->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'company' => $mentor->company,
                'designation' => $mentor->designation,
                'industry' => $mentor->industry,
                'experience' => $mentor->experience,
                'location' => $mentor->location,
                'bio' => $mentor->bio,

                'rating' => (float) $mentor->rating,
                'reviewCount' => $mentor->review_count,
                'sessionCount' => $mentor->session_count,

                'verified' => $mentor->verified,
                'available' => $mentor->available,

                'profilePhoto' => $mentor->profile_photo
                    ? asset('storage/' . $mentor->profile_photo)
                    : null,

                'skills' => $mentor->skills
                    ->pluck('skill')
                    ->values(),

                'languages' => $mentor->languages
                    ->pluck('language')
                    ->values(),

                'services' => $mentor->services->map(function ($service) {
                    return [
                        'id' => $service->id,
                        'title' => $service->title,
                        'description' => $service->description,
                        'price' => (int) $service->price,
                        'duration' => $service->duration,
                        'sessionType' => $service->session_type,
                        'status' => $service->status,
                    ];
                })->values(),

                'availability' => $mentor->availabilities
                    ->where('is_available', true)
                    ->map(function ($availability) {
                        return [
                            'id' => $availability->id,
                            'dayOfWeek' => $availability->day_of_week,
                            'startTime' => $availability->start_time,
                            'endTime' => $availability->end_time,
                        ];
                    })->values(),

                'reviews' => $mentor->reviews
                    ->where('status', 'submitted')
                    ->sortByDesc('submitted_at')
                    ->take(3)
                    ->map(function ($review) {
                        return [
                            'id' => $review->id,
                            'userName' => $review->user?->name ?? 'Candidate',
                            'rating' => (int) $review->rating,
                            'comment' => $review->comment,
                            'submittedAt' => optional($review->submitted_at)
                                ->format('d M Y'),
                        ];
                    })->values(),

                'stats' => [
                    'sessionsConducted' => $mentor->session_count,
                    'reviewCount' => $mentor->review_count,
                    'averageRating' => (float) $mentor->rating,
                ],
            ],
        ]);
    }
}