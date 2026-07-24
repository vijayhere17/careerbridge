<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\JobApplicationResource;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    /**
     * POST /api/opportunities/apply
     */
    public function apply(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 401);
        }

        $request->validate([
            'opportunity_id' => 'required|exists:opportunities,id',
            'resume' => 'nullable|string',
            'message' => 'nullable|string|max:1000',
        ]);

        $alreadyApplied = JobApplication::where('user_id', $user->id)
            ->where('opportunity_id', $request->opportunity_id)
            ->exists();

        if ($alreadyApplied) {
            return response()->json([
                'message' => 'You have already applied for this opportunity.'
            ], 422);
        }

        $application = JobApplication::create([
            'user_id' => $user->id,
            'opportunity_id' => $request->opportunity_id,
            'resume' => $request->resume,
            'message' => $request->message,
            'status' => 'Applied',
            'applied_at' => now(),
        ]);

        $application->load('opportunity');

        return response()->json([
            'success' => true,
            'message' => 'Application submitted successfully.',
            'application' => new JobApplicationResource($application),
        ]);
    }

    /**
     * GET /api/opportunities/applications
     */
    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 401);
        }

        $applications = JobApplication::with('opportunity')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'applications' => JobApplicationResource::collection($applications),
        ]);
    }
}