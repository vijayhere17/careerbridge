<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OpportunityResource;
use App\Models\Opportunity;
use Illuminate\Http\Request;

class OpportunityController extends Controller
{
    public function index(Request $request)
    {
        $query = Opportunity::with(['skills', 'benefits'])
            ->where('active', true);

        // Search
        if ($search = $request->q) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('company', 'like', "%{$search}%")
                  ->orWhere('role', 'like', "%{$search}%")
                  ->orWhere('industry', 'like', "%{$search}%")
                  ->orWhere('domain', 'like', "%{$search}%");
            });
        }

        // Category
        if ($request->category) {
            $query->where('category', $request->category);
        }

        // Work Type
        if ($request->work_type) {
            $query->where('work_type', $request->work_type);
        }

        // Location
        if ($request->location) {
            $query->where('location', 'like', "%{$request->location}%");
        }

        return response()->json([
            'opportunities' => OpportunityResource::collection(
                $query->latest()->get()
            )
        ]);
    }

    public function show(Opportunity $opportunity)
    {
        $opportunity->load(['skills', 'benefits']);

        return response()->json([
            'opportunity' => new OpportunityResource($opportunity)
        ]);
    }
}