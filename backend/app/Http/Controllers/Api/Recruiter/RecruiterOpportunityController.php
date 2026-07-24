<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\RecruiterOpportunity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RecruiterOpportunityController extends Controller
{
    /**
     * Authenticate using API Token
     */
    private function authUser(Request $request)
    {
        $token = $request->bearerToken()
            ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    /**
     * List Recruiter's Opportunities
     */
    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.'
            ], 401);
        }

        $opportunities = RecruiterOpportunity::where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'count' => $opportunities->count(),
            'data' => $opportunities
        ]);
    }

    /**
     * Publish Opportunity
     */
    public function store(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.'
            ], 401);
        }

        $validator = Validator::make($request->all(), [

            'opportunity_type' => 'required|string',

            'title' => 'required|string|max:255',

            'company_name' => 'required|string|max:255',

            'location' => 'nullable|string|max:255',

            'employment_type' => 'nullable|string|max:100',

            'experience_level' => 'nullable|string|max:100',

            'salary_min' => 'nullable|numeric',

            'salary_max' => 'nullable|numeric',

            'application_deadline' => 'nullable|date',

            'skills' => 'nullable|string',

            'description' => 'nullable|string',

            'responsibilities' => 'nullable|string',

            'requirements' => 'nullable|string',

            'benefits' => 'nullable|string',

            'work_mode' => 'nullable|in:Remote,Hybrid,Office',

            'contact_visibility' => 'nullable|in:public,locked',

        ]);

        if ($validator->fails()) {

            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);

        }

        $opportunity = RecruiterOpportunity::create([

            'user_id' => $user->id,

            'opportunity_type' => $request->opportunity_type,

            'title' => $request->title,

            'company_name' => $request->company_name,

            'location' => $request->location,

            'employment_type' => $request->employment_type,

            'experience_level' => $request->experience_level,

            'salary_min' => $request->salary_min,

            'salary_max' => $request->salary_max,

            'application_deadline' => $request->application_deadline,

            'skills' => $request->skills,

            'description' => $request->description,

            'responsibilities' => $request->responsibilities,

            'requirements' => $request->requirements,

            'benefits' => $request->benefits,

            'work_mode' => $request->work_mode ?? 'Hybrid',

            'contact_visibility' => $request->contact_visibility ?? 'locked',

            'status' => 'published',

            'views' => 0,

            'applications_count' => 0,

        ]);

        return response()->json([

            'success' => true,

            'message' => 'Opportunity published successfully.',

            'data' => $opportunity

        ], 201);
    }

    /**
     * Save Draft
     */
    public function saveDraft(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {

            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.'
            ],401);

        }

        $opportunity = RecruiterOpportunity::create([

            'user_id' => $user->id,

            'opportunity_type' => $request->opportunity_type,

            'title' => $request->title,

            'company_name' => $request->company_name,

            'location' => $request->location,

            'employment_type' => $request->employment_type,

            'experience_level' => $request->experience_level,

            'salary_min' => $request->salary_min,

            'salary_max' => $request->salary_max,

            'application_deadline' => $request->application_deadline,

            'skills' => $request->skills,

            'description' => $request->description,

            'responsibilities' => $request->responsibilities,

            'requirements' => $request->requirements,

            'benefits' => $request->benefits,

            'work_mode' => $request->work_mode ?? 'Hybrid',

            'contact_visibility' => $request->contact_visibility ?? 'locked',

            'status' => 'draft',

        ]);

        return response()->json([

            'success' => true,

            'message' => 'Draft saved successfully.',

            'data' => $opportunity

        ]);

    }

        /**
     * Show Single Opportunity
     */
    public function show(Request $request, $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.'
            ], 401);
        }

        $opportunity = RecruiterOpportunity::where('user_id', $user->id)
            ->find($id);

        if (!$opportunity) {
            return response()->json([
                'success' => false,
                'message' => 'Opportunity not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $opportunity
        ]);
    }

    /**
     * Update Opportunity
     */
    public function update(Request $request, $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.'
            ], 401);
        }

        $opportunity = RecruiterOpportunity::where('user_id', $user->id)
            ->find($id);

        if (!$opportunity) {
            return response()->json([
                'success' => false,
                'message' => 'Opportunity not found.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [

            'opportunity_type' => 'required|string',

            'title' => 'required|string|max:255',

            'company_name' => 'required|string|max:255',

            'location' => 'nullable|string|max:255',

            'employment_type' => 'nullable|string|max:100',

            'experience_level' => 'nullable|string|max:100',

            'salary_min' => 'nullable|numeric',

            'salary_max' => 'nullable|numeric',

            'application_deadline' => 'nullable|date',

            'skills' => 'nullable|string',

            'description' => 'nullable|string',

            'responsibilities' => 'nullable|string',

            'requirements' => 'nullable|string',

            'benefits' => 'nullable|string',

            'work_mode' => 'nullable|in:Remote,Hybrid,Office',

            'contact_visibility' => 'nullable|in:public,locked',

            'status' => 'nullable|in:draft,published,closed',

        ]);

        if ($validator->fails()) {

            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);

        }

        $opportunity->update([

            'opportunity_type' => $request->opportunity_type,

            'title' => $request->title,

            'company_name' => $request->company_name,

            'location' => $request->location,

            'employment_type' => $request->employment_type,

            'experience_level' => $request->experience_level,

            'salary_min' => $request->salary_min,

            'salary_max' => $request->salary_max,

            'application_deadline' => $request->application_deadline,

            'skills' => $request->skills,

            'description' => $request->description,

            'responsibilities' => $request->responsibilities,

            'requirements' => $request->requirements,

            'benefits' => $request->benefits,

            'work_mode' => $request->work_mode,

            'contact_visibility' => $request->contact_visibility,

            'status' => $request->status ?? $opportunity->status,

        ]);

        return response()->json([

            'success' => true,

            'message' => 'Opportunity updated successfully.',

            'data' => $opportunity->fresh()

        ]);

    }

    /**
     * Delete Opportunity
     */
    public function destroy(Request $request, $id)
    {
        $user = $this->authUser($request);

        if (!$user) {

            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.'
            ], 401);

        }

        $opportunity = RecruiterOpportunity::where('user_id', $user->id)
            ->find($id);

        if (!$opportunity) {

            return response()->json([
                'success' => false,
                'message' => 'Opportunity not found.'
            ], 404);

        }

        $opportunity->delete();

        return response()->json([

            'success' => true,

            'message' => 'Opportunity deleted successfully.'

        ]);

    }
}