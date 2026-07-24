<?php

namespace App\Http\Controllers\Api\HR;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

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
            'profile' => $this->transformUser($user),
            'company' => $profile ? [
                'company_name' => $profile->company_name,
                'designation' => $profile->designation,
                'department' => $profile->department,
                'phone' => $profile->phone,
                'office_location' => $profile->office_location,
                'locations' => $profile->locations ?? [],
                'logo_url' => $profile->logoUrl(),
                'cover_url' => $profile->coverUrl(),
            ] : null,
            'preferences' => $this->preferences($user),
        ], 'Settings retrieved successfully.');
    }

    public function updateProfile(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'mobile' => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('users', 'mobile')->ignore($user->id),
            ],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user->fill($validator->validated())->save();
        $this->logActivity($user, 'updated', 'settings', 'Updated account profile');

        return $this->success($this->transformUser($user), 'Profile settings updated.');
    }

    public function changePassword(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $user->password = $validator->validated()['password'];
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

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $validator = Validator::make($request->all(), [
            'preferences' => 'nullable|array',
            'email_notifications' => 'nullable|boolean',
            'interview_reminders' => 'nullable|boolean',
            'application_alerts' => 'nullable|boolean',
            'weekly_digest' => 'nullable|boolean',
            'candidate_updates' => 'nullable|boolean',
            'job_expiry_alerts' => 'nullable|boolean',
            'timezone' => 'nullable|string|max:100',
            'date_format' => 'nullable|string|max:50',
            'language' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $preferences = array_merge($this->preferences($user), $data['preferences'] ?? []);

        foreach (array_keys($this->defaultPreferences()) as $key) {
            if (array_key_exists($key, $data)) {
                $preferences[$key] = $data[$key];
            }
        }

        $user->forceFill(['hr_preferences' => $preferences])->save();

        $this->logActivity($user, 'updated', 'settings', 'Updated HR preferences');

        return $this->success($preferences, 'Preferences saved.');
    }

    public function updateAvatar(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($user->profile_photo && !str_starts_with($user->profile_photo, 'http')) {
            Storage::disk('public')->delete($user->profile_photo);
        }

        $user->forceFill([
            'profile_photo' => $request->file('avatar')->store('hr/avatars', 'public'),
        ])->save();

        $this->logActivity($user, 'updated', 'settings', 'Updated avatar');

        return $this->success($this->transformUser($user), 'Avatar updated.');
    }

    private function transformUser($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'mobile' => $user->mobile,
            'profile_photo' => $user->profile_photo,
            'profile_photo_url' => $this->mediaUrl($user->profile_photo),
        ];
    }

    private function preferences($user): array
    {
        return array_merge($this->defaultPreferences(), $user->hr_preferences ?? []);
    }

    private function defaultPreferences(): array
    {
        return [
            'email_notifications' => true,
            'interview_reminders' => true,
            'application_alerts' => true,
            'weekly_digest' => false,
            'candidate_updates' => true,
            'job_expiry_alerts' => true,
            'timezone' => config('app.timezone', 'UTC'),
            'date_format' => 'Y-m-d',
            'language' => 'en',
        ];
    }
}
