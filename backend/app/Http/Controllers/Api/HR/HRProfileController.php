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
            'user' => $this->transformUser($user),
            'profile' => $profile ? $this->transform($profile) : null,
        ], 'Profile retrieved successfully.');
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

        $profile = $user->hrProfile;
        $this->decodeJsonArrayInput($request, ['locations', 'social_links']);

        $validator = Validator::make($request->all(), [
            'company_name' => ($profile ? 'sometimes|required' : 'required') . '|string|max:255',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'company_website' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'company_size' => 'nullable|string|max:100',
            'company_description' => 'nullable|string|max:5000',
            'culture' => 'nullable|string|max:10000',
            'benefits' => 'nullable|string|max:10000',
            'office_location' => 'nullable|string|max:255',
            'locations' => 'nullable|array',
            'phone' => 'nullable|string|max:30',
            'linkedin' => 'nullable|string|max:255',
            'social_links' => 'nullable|array',
            'company_logo' => 'nullable|image|max:4096',
            'company_cover' => 'nullable|image|max:8192',
            'name' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:30',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $userPayload = array_filter([
            'name' => $data['name'] ?? null,
            'mobile' => $data['mobile'] ?? null,
        ], fn ($value) => $value !== null);

        if ($userPayload) {
            $user->fill($userPayload)->save();
        }

        $profile = $profile ?? new HRProfile(['user_id' => $user->id]);
        $profileData = [];
        foreach ([
            'company_name',
            'designation',
            'department',
            'company_website',
            'industry',
            'company_size',
            'company_description',
            'culture',
            'benefits',
            'office_location',
            'locations',
            'phone',
            'linkedin',
            'social_links',
        ] as $field) {
            if (array_key_exists($field, $data)) {
                $profileData[$field] = $data[$field];
            }
        }

        $profile->fill($profileData);

        if ($request->hasFile('company_logo')) {
            $this->deletePublicFile($profile->company_logo);
            $profile->company_logo = $request->file('company_logo')->store('hr/logos', 'public');
        }

        if ($request->hasFile('company_cover')) {
            $this->deletePublicFile($profile->company_cover);
            $profile->company_cover = $request->file('company_cover')->store('hr/covers', 'public');
        }

        $profile->user_id = $user->id;
        $profile->save();

        $this->logActivity($user, 'updated', 'profile', 'Updated company profile');

        return $this->success([
            'user' => $this->transformUser($user->fresh()),
            'profile' => $this->transform($profile->fresh()),
        ], 'Profile updated successfully.');
    }

    private function decodeJsonArrayInput(Request $request, array $fields): void
    {
        foreach ($fields as $field) {
            $value = $request->input($field);

            if (!is_string($value)) {
                continue;
            }

            $decoded = json_decode($value, true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $request->merge([$field => $decoded]);
            }
        }
    }

    private function deletePublicFile(?string $path): void
    {
        if ($path && !str_starts_with($path, 'http')) {
            Storage::disk('public')->delete($path);
        }
    }

    private function transformUser($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'mobile' => $user->mobile,
            'profile_photo' => $this->mediaUrl($user->profile_photo),
        ];
    }

    private function transform(HRProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'company_name' => $profile->company_name,
            'designation' => $profile->designation,
            'department' => $profile->department,
            'company_logo' => $profile->company_logo,
            'logo_url' => $profile->logoUrl(),
            'company_cover' => $profile->company_cover,
            'cover_url' => $profile->coverUrl(),
            'company_website' => $profile->company_website,
            'industry' => $profile->industry,
            'company_size' => $profile->company_size,
            'company_description' => $profile->company_description,
            'culture' => $profile->culture,
            'benefits' => $profile->benefits,
            'office_location' => $profile->office_location,
            'locations' => $profile->locations ?? [],
            'phone' => $profile->phone,
            'linkedin' => $profile->linkedin,
            'social_links' => $profile->social_links ?? [],
            'verified' => (bool) $profile->verified,
            'status' => $profile->status,
            'created_at' => $profile->created_at,
            'updated_at' => $profile->updated_at,
        ];
    }
}
