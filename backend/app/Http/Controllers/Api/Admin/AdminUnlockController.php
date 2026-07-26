<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\RecruiterContactUnlock;
use Illuminate\Http\Request;

class AdminUnlockController extends AdminBaseController
{
    public function index(Request $request)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        $query = RecruiterContactUnlock::with([
            'recruiter:id,name,email',
            'candidate:id,name,email',
            'opportunity:id,title,company_name',
        ])->latest('unlocked_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('recruiter', function ($recruiter) use ($search) {
                    $recruiter->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('candidate', function ($candidate) use ($search) {
                    $candidate->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            });
        }

        $paginator = $query->paginate(min(max((int) $request->query('per_page', 12), 1), 50));

        return $this->success([
            'items' => collect($paginator->items())->map(fn (RecruiterContactUnlock $item) => [
                'id' => $item->id,
                'amount' => (float) $item->amount,
                'status' => $item->status,
                'unlocked_at' => $item->unlocked_at,
                'created_at' => $item->created_at,
                'recruiter' => $item->recruiter ? [
                    'id' => $item->recruiter->id,
                    'name' => $item->recruiter->name,
                    'email' => $item->recruiter->email,
                ] : null,
                'candidate' => $item->candidate ? [
                    'id' => $item->candidate->id,
                    'name' => $item->candidate->name,
                    'email' => $item->candidate->email,
                ] : null,
                'opportunity' => $item->opportunity ? [
                    'id' => $item->opportunity->id,
                    'title' => $item->opportunity->title,
                    'company_name' => $item->opportunity->company_name,
                ] : null,
            ]),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'stats' => [
                'total_amount' => (float) RecruiterContactUnlock::where('status', 'earned')->sum('amount'),
                'total_count' => RecruiterContactUnlock::count(),
            ],
        ], 'Unlock history retrieved successfully.');
    }
}
