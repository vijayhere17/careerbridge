<?php

namespace App\Http\Controllers\Api\HR;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class HRSettingsController extends HRBaseController
{
    public function show(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $profile = $user->hrProfile;

        return $this->success([
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'profile_photo' => $this->mediaUrl($user->profile_photo),
            ],
            'company' => $profile ? [
                'company_name' => $profile->company_name,
                'designation' => $profile->designation,
                'department' => $profile->department,
                'phone' => $profile->phone,
                'office_location' => $profile->office_location,
            ] : null,
            'preferences' => [
                'email_notifications' => true,
                'interview_reminders' => true,
                'application_alerts' => true,
                'weekly_digest' => false,
            ],
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->fill($validator->validated())->save();
        $this->logActivity($user, 'updated', 'settings', 'Updated account profile');

        return $this->success([
            'name' => $user->name,
            'email' => $user->email,
            'mobile' => $user->mobile,
        ], 'Profile settings updated.');
    }

    public function changePassword(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $user->password = $request->password;
        $user->save();

        $this->logActivity($user, 'updated', 'settings', 'Changed password');

        return $this->success(null, 'Password changed successfully.');
    }

    public function updatePreferences(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $validator = Validator::make($request->all(), [
            'email_notifications' => 'nullable|boolean',
            'interview_reminders' => 'nullable|boolean',
            'application_alerts' => 'nullable|boolean',
            'weekly_digest' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $this->logActivity($user, 'updated', 'settings', 'Updated notification preferences');

        return $this->success($validator->validated(), 'Preferences saved.');
    }
}
