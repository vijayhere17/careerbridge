<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileResource;
use App\Models\User;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    /**
     * GET /api/profile
     */
    public function show(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        return response()->json([
            'profile' => new ProfileResource($user),
        ]);
    }

    /**
     * POST /api/profile/update
     */
    public function update(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $request->merge([
    'skills' => json_decode($request->skills, true) ?? [],
    'lookingFor' => json_decode($request->lookingFor, true) ?? [],
]);

        $request->validate([
            'firstName' => 'required|string|max:100',
            'lastName' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:500',
            'currentRole' => 'nullable|string|max:150',
            'company' => 'nullable|string|max:150',
            'experience' => 'nullable|string|max:100',
            'education' => 'nullable|string|max:255',
            'linkedin' => 'nullable|string|max:255',
            'github' => 'nullable|string|max:255',
            'portfolio' => 'nullable|string|max:255',
            'skills' => 'nullable|array',
            'lookingFor' => 'nullable|array',
            'profilePhoto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $profilePhoto = $user->profile_photo;

if ($request->hasFile('profilePhoto')) {

    if ($profilePhoto && \Storage::disk('public')->exists($profilePhoto)) {
        \Storage::disk('public')->delete($profilePhoto);
    }

    $profilePhoto = $request->file('profilePhoto')
        ->store('profile_photos', 'public');
}

        $user->update([
            'name' => $request->firstName,
            'last_name' => $request->lastName,
            'mobile' => $request->phone,
            'location' => $request->location,
            'bio' => $request->bio,
            'current_role' => $request->currentRole,
            'company' => $request->company,
            'experience' => $request->experience,
            'education' => $request->education,
            'linkedin' => $request->linkedin,
            'github' => $request->github,
            'portfolio' => $request->portfolio,
            'skills' => $request->skills,
            'looking_for' => $request->lookingFor,
            'profile_photo' => $profilePhoto,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'profile' => new ProfileResource($user->fresh()),
        ]);
    }
}