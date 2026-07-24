<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class HRProfileController extends HRBaseController
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
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'profile_photo' => $this->mediaUrl($user->profile_photo),
            ],
            'profile' => $profile ? $this->transform($profile) : null,
        ]);
    }

    public function update(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'company_website' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'company_size' => 'nullable|string|max:100',
            'company_description' => 'nullable|string|max:5000',
            'office_location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
            'linkedin' => 'nullable|string|max:255',
            'company_logo' => 'nullable|image|max:4096',
            'name' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($request->filled('name') || $request->filled('mobile')) {
            $user->fill(array_filter([
                'name' => $request->name,
                'mobile' => $request->mobile,
            ], fn ($v) => $v !== null))->save();
        }

        $profile = $user->hrProfile ?? new HRProfile(['user_id' => $user->id]);

        $profile->fill([
            'company_name' => $request->company_name,
            'designation' => $request->designation,
            'department' => $request->department,
            'company_website' => $request->company_website,
            'industry' => $request->industry,
            'company_size' => $request->company_size,
            'company_description' => $request->company_description,
            'office_location' => $request->office_location,
            'phone' => $request->phone,
            'linkedin' => $request->linkedin,
        ]);

        if ($request->hasFile('company_logo')) {
            if ($profile->company_logo) {
                Storage::disk('public')->delete($profile->company_logo);
            }
            $profile->company_logo = $request->file('company_logo')->store('hr/logos', 'public');
        }

        $profile->user_id = $user->id;
        $profile->save();

        $this->logActivity($user, 'updated', 'profile', 'Updated company profile');

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'profile_photo' => $this->mediaUrl($user->profile_photo),
            ],
            'profile' => $this->transform($profile),
        ], 'Profile updated successfully.');
    }

    private function transform(HRProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'company_name' => $profile->company_name,
            'designation' => $profile->designation,
            'department' => $profile->department,
            'company_logo' => $profile->logoUrl(),
            'company_website' => $profile->company_website,
            'industry' => $profile->industry,
            'company_size' => $profile->company_size,
            'company_description' => $profile->company_description,
            'office_location' => $profile->office_location,
            'phone' => $profile->phone,
            'linkedin' => $profile->linkedin,
            'verified' => (bool) $profile->verified,
            'status' => $profile->status,
            'created_at' => $profile->created_at,
            'updated_at' => $profile->updated_at,
        ];
    }
}
