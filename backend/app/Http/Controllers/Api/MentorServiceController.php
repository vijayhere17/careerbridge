<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MentorService;
use App\Models\User;
use Illuminate\Http\Request;

class MentorServiceController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken()
            ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $mentor = $user->mentorProfile;

        if (!$mentor) {
            return response()->json([
                'services' => [],
            ]);
        }

        $services = MentorService::withCount('bookings')
            ->where('mentor_id', $mentor->id)
            ->latest()
            ->get()
            ->map(function ($service) {
                return [
                    'id' => (string) $service->id,
                    'title' => $service->title,
                    'description' => $service->description ?? '',
                    'type' => $service->session_type,
                    'duration' => (int) $service->duration,
                    'price' => (int) $service->price,
                    'active' => $service->status === 'active',
                    'bookings' => (int) $service->bookings_count,
                ];
            });

        return response()->json([
            'services' => $services,
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user || !$user->mentorProfile) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:300',
            'type' => 'required|in:Video Call,Audio Call,Chat',
            'duration' => 'required|integer|in:15,30,45,60,90,120',
            'price' => 'required|integer|min:1',
            'active' => 'required|boolean',
        ]);

        $service = MentorService::create([
            'mentor_id' => $user->mentorProfile->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'session_type' => $validated['type'],
            'duration' => $validated['duration'],
            'price' => $validated['price'],
            'status' => $validated['active'] ? 'active' : 'inactive',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service created successfully.',
            'service' => $this->serviceData($service),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $this->authUser($request);

        if (!$user || !$user->mentorProfile) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $service = MentorService::where('id', $id)
            ->where('mentor_id', $user->mentorProfile->id)
            ->first();

        if (!$service) {
            return response()->json([
                'message' => 'Service not found.'
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:300',
            'type' => 'required|in:Video Call,Audio Call,Chat',
            'duration' => 'required|integer|in:15,30,45,60,90,120',
            'price' => 'required|integer|min:1',
            'active' => 'required|boolean',
        ]);

        $service->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'session_type' => $validated['type'],
            'duration' => $validated['duration'],
            'price' => $validated['price'],
            'status' => $validated['active'] ? 'active' : 'inactive',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully.',
            'service' => $this->serviceData($service),
        ]);
    }

    public function toggle(Request $request, $id)
    {
        $user = $this->authUser($request);

        if (!$user || !$user->mentorProfile) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $service = MentorService::where('id', $id)
            ->where('mentor_id', $user->mentorProfile->id)
            ->first();

        if (!$service) {
            return response()->json([
                'message' => 'Service not found.'
            ], 404);
        }

        $service->update([
            'status' => $service->status === 'active'
                ? 'inactive'
                : 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service status updated.',
            'service' => $this->serviceData($service),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $this->authUser($request);

        if (!$user || !$user->mentorProfile) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $service = MentorService::where('id', $id)
            ->where('mentor_id', $user->mentorProfile->id)
            ->first();

        if (!$service) {
            return response()->json([
                'message' => 'Service not found.'
            ], 404);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully.',
        ]);
    }

    private function serviceData(MentorService $service): array
    {
        return [
            'id' => (string) $service->id,
            'title' => $service->title,
            'description' => $service->description ?? '',
            'type' => $service->session_type,
            'duration' => (int) $service->duration,
            'price' => (int) $service->price,
            'active' => $service->status === 'active',
            'bookings' => $service->bookings()->count(),
        ];
    }
}