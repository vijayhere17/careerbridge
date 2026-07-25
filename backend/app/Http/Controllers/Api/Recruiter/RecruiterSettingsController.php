<?php

namespace App\Http\Controllers\Api\Recruiter;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RecruiterSettingsController extends RecruiterBaseController
{
    public function show(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        return $this->success([
            'profile' => $this->transformUser($user),
            'preferences' => $this->preferences($user),
        ], 'Settings retrieved successfully.');
    }

    public function updateProfile(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'mobile' => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('users', 'mobile')->ignore($user->id),
            ],
            'company' => 'nullable|string|max:255',
            'current_role' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user->fill($validator->validated())->save();

        return $this->success($this->transformUser($user), 'Profile updated successfully.');
    }

    public function changePassword(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $user->password = $request->input('password');
        $user->save();

        return $this->success(null, 'Password changed successfully.');
    }

    public function updatePreferences(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'preferences' => 'nullable|array',
            'email_notifications' => 'nullable|boolean',
            'push_notifications' => 'nullable|boolean',
            'application_alerts' => 'nullable|boolean',
            'unlock_alerts' => 'nullable|boolean',
            'withdraw_alerts' => 'nullable|boolean',
            'weekly_digest' => 'nullable|boolean',
            'profile_visibility' => 'nullable|boolean',
            'show_contact_publicly' => 'nullable|boolean',
            'timezone' => 'nullable|string|max:100',
            'date_format' => 'nullable|string|max:50',
            'language' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        $preferences = array_merge($this->preferences($user), $data['preferences'] ?? []);

        foreach (array_keys($this->defaultPreferences()) as $key) {
            if (array_key_exists($key, $data)) {
                $preferences[$key] = $data[$key];
            }
        }

        $stored = is_array($user->hr_preferences) ? $user->hr_preferences : [];
        $stored['recruiter_preferences'] = $preferences;
        $user->forceFill(['hr_preferences' => $stored])->save();

        return $this->success($preferences, 'Preferences saved successfully.');
    }

    private function transformUser($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'mobile' => $user->mobile,
            'role' => $user->role,
            'company' => $user->company,
            'current_role' => $user->current_role,
            'location' => $user->location,
            'bio' => $user->bio,
            'profile_photo' => $user->profile_photo,
            'profile_photo_url' => $this->mediaUrl($user->profile_photo),
        ];
    }

    private function preferences($user): array
    {
        $stored = is_array($user->hr_preferences) ? $user->hr_preferences : [];
        $recruiterPreferences = $stored['recruiter_preferences'] ?? [];

        if (!is_array($recruiterPreferences)) {
            $recruiterPreferences = [];
        }

        return array_merge($this->defaultPreferences(), $recruiterPreferences);
    }

    private function defaultPreferences(): array
    {
        return [
            'email_notifications' => true,
            'push_notifications' => true,
            'application_alerts' => true,
            'unlock_alerts' => true,
            'withdraw_alerts' => true,
            'weekly_digest' => false,
            'profile_visibility' => true,
            'show_contact_publicly' => false,
            'timezone' => config('app.timezone', 'UTC'),
            'date_format' => 'Y-m-d',
            'language' => 'en',
        ];
    }
}
