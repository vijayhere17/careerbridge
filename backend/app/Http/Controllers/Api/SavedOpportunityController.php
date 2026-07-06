<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OpportunityResource;
use App\Models\Opportunity;
use App\Models\SavedOpportunity;
use App\Models\User;
use Illuminate\Http\Request;

class SavedOpportunityController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    /**
     * GET /api/opportunities/saved
     */
    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 401);
        }

        $saved = SavedOpportunity::with([
            'opportunity.skills',
            'opportunity.benefits',
        ])
        ->where('user_id', $user->id)
        ->latest()
        ->get();

        return response()->json([
            'opportunities' => OpportunityResource::collection(
                $saved->pluck('opportunity')
            ),
        ]);
    }

    /**
     * POST /api/opportunities/save
     */
    public function store(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 401);
        }

        $request->validate([
            'opportunity_id' => 'required|exists:opportunities,id',
        ]);

        SavedOpportunity::firstOrCreate([
            'user_id' => $user->id,
            'opportunity_id' => $request->opportunity_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Opportunity saved successfully.',
        ]);
    }

    /**
     * DELETE /api/opportunities/save/{opportunity}
     */
    public function destroy(Request $request, Opportunity $opportunity)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 401);
        }

        SavedOpportunity::where('user_id', $user->id)
            ->where('opportunity_id', $opportunity->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Opportunity removed successfully.',
        ]);
    }
}