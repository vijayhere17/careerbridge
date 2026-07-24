<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateMentorProfileRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MentorProfileSettingsController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken()
            ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    /**
     * Get Mentor Profile Settings
     */
    public function show(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 401);
        }

        $mentor = $user->mentorProfile()->with([
    'skills',
    'languages',
    'bankDetail',
])->first();



        if (!$mentor) {
            return response()->json([
                'message' => 'Mentor profile not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,

            'profile' => [

                'id' => $user->id,

                'name' => $user->name,

                'last_name' => $user->last_name,

                'full_name' => trim($user->name . ' ' . $user->last_name),

                'email' => $user->email,

                'linkedin_url' => $mentor->linkedin_url,

'portfolio_url' => $mentor->portfolio_url,

'resume' => $mentor->resume
    ? asset('storage/'.$mentor->resume)
    : null,

'professional_summary' => $mentor->professional_summary,

'skills' => $mentor->skills->pluck('skill')->values(),

'languages' => $mentor->languages->pluck('language')->values(),

                'mobile' => $user->mobile,

                'company' => $mentor->company,

                'designation' => $mentor->designation,

                'industry' => $mentor->industry,

                'experience' => $mentor->experience,

                'location' => $mentor->location,

                'bio' => $mentor->bio,

                'profile_photo' => $mentor->profile_photo
                    ? asset('storage/' . $mentor->profile_photo)
                    : null,

                'bank' => [
    'account_holder' => $mentor->bankDetail?->account_holder,
    'bank_name' => $mentor->bankDetail?->bank_name,
    'account_number' => $mentor->bankDetail?->account_number,
    'ifsc_code' => $mentor->bankDetail?->ifsc_code,
    'upi_id' => $mentor->bankDetail?->upi_id,
],
            ]
        ]);
    }

    /**
     * Update Mentor Profile
     */
    public function update(UpdateMentorProfileRequest $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 401);
        }

        $mentor = $user->mentorProfile;

        if (!$mentor) {
            return response()->json([
                'message' => 'Mentor profile not found.'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Update User Table
        |--------------------------------------------------------------------------
        */

        $user->update([
            'name' => $request->name,
            'last_name' => $request->last_name,
            'mobile' => $request->mobile,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Upload Photo
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('profile_photo')) {

            if (
                $mentor->profile_photo &&
                Storage::disk('public')->exists($mentor->profile_photo)
            ) {
                Storage::disk('public')->delete($mentor->profile_photo);
            }

            $mentor->profile_photo = $request
                ->file('profile_photo')
                ->store('profile-photos', 'public');
        }

        if ($request->hasFile('resume')) {

    if (
        $mentor->resume &&
        Storage::disk('public')->exists($mentor->resume)
    ) {
        Storage::disk('public')->delete($mentor->resume);
    }

    $mentor->resume = $request
        ->file('resume')
        ->store('mentor-resumes', 'public');
}

        /*
        |--------------------------------------------------------------------------
        | Update Mentor Profile
        |--------------------------------------------------------------------------
        */

        $mentor->company = $request->company;

        $mentor->designation = $request->designation;

        $mentor->industry = $request->industry;

        $mentor->experience = $request->experience;

        $mentor->linkedin_url = $request->linkedin_url;

$mentor->portfolio_url = $request->portfolio_url;

$mentor->professional_summary = $request->professional_summary;

        $mentor->location = $request->location;

        $mentor->bio = $request->bio;

        $mentor->save();


        /*
|--------------------------------------------------------------------------
| Save Bank Details
|--------------------------------------------------------------------------
*/

$bank = $mentor->bankDetail()->firstOrNew();

$bank->account_holder = $request->account_holder;
$bank->bank_name = $request->bank_name;
$bank->account_number = $request->account_number;
$bank->ifsc_code = $request->ifsc_code;
$bank->upi_id = $request->upi_id;

$mentor->bankDetail()->save($bank);

        /*
|--------------------------------------------------------------------------
| Save Skills
|--------------------------------------------------------------------------
*/

if ($request->filled('skills')) {

    $mentor->skills()->delete();

    foreach ($request->input('skills', []) as $skill) {

        if (!empty(trim($skill))) {

            $mentor->skills()->create([
                'skill' => trim($skill),
            ]);

        }

    }

}

/*
|--------------------------------------------------------------------------
| Save Languages
|--------------------------------------------------------------------------
*/

if ($request->filled('languages')) {

    $mentor->languages()->delete();

    foreach ($request->input('languages', []) as $language) {

        if (!empty(trim($language))) {

            $mentor->languages()->create([
                'language' => trim($language),
            ]);

        }

    }

}

        return $this->show($request);
    }
}