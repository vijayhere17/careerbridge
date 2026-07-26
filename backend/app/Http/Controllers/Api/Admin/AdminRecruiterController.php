<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\RecruiterAdminAction;
use App\Models\RecruiterProfile;
use App\Services\AdminRecruiterService;
use App\Support\Roles;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

class AdminRecruiterController extends AdminBaseController
{
    public function __construct(private AdminRecruiterService $recruiters)
    {
    }

    public function index(Request $request)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        $paginator = $this->recruiters->listRecruiters($request->only([
            'status', 'type', 'search', 'date_from', 'date_to', 'sort', 'per_page', 'page',
        ]));

        return $this->success([
            'items' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Recruiters retrieved successfully.');
    }

    public function show(Request $request, int $userId)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        try {
            return $this->success($this->recruiters->detail($userId), 'Recruiter details retrieved successfully.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->notFound('Recruiter not found.');
        }
    }

    public function history(Request $request, int $userId)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        try {
            $detail = $this->recruiters->detail($userId);

            return $this->success([
                'history' => $detail['history'],
            ], 'Recruiter history retrieved successfully.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->notFound('Recruiter not found.');
        }
    }

    public function users(Request $request, string $role)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        $map = [
            'mentors' => Roles::MENTOR,
            'seekers' => Roles::SEEKER,
            'job-seekers' => Roles::SEEKER,
        ];

        if (! isset($map[$role])) {
            return $this->notFound('Unknown user collection.');
        }

        $search = trim((string) $request->query('search', ''));
        $query = User::query()->where('role', $map[$role])->latest();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        $paginator = $query->paginate(min(max((int) $request->query('per_page', 12), 1), 50));

        return $this->success([
            'items' => collect($paginator->items())->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'created_at' => $user->created_at?->toIso8601String(),
                'verified_email' => (bool) ($user->verified_email || $user->email_verified_at),
            ])->all(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Users retrieved successfully.');
    }

    public function settings(Request $request)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        return $this->success([
            'require_admin_approval' => (bool) config('recruiter.require_admin_approval', true),
            'recruiter_types' => RecruiterProfile::TYPES,
            'approval_statuses' => [
                RecruiterProfile::APPROVAL_PENDING,
                RecruiterProfile::APPROVAL_APPROVED,
                RecruiterProfile::APPROVAL_REJECTED,
                RecruiterProfile::APPROVAL_CHANGES_REQUESTED,
                RecruiterProfile::APPROVAL_SUSPENDED,
            ],
            'actions' => [
                RecruiterAdminAction::ACTION_APPROVE,
                RecruiterAdminAction::ACTION_REJECT,
                RecruiterAdminAction::ACTION_REQUEST_CHANGES,
                RecruiterAdminAction::ACTION_SUSPEND,
                RecruiterAdminAction::ACTION_REACTIVATE,
                RecruiterAdminAction::ACTION_INTERNAL_NOTE,
            ],
        ], 'Admin settings retrieved successfully.');
    }

    /**
     * Shared review handler used by /api/admin/recruiters/{id}/review
     * and the legacy /api/recruiter/onboarding/{userId}/review route.
     */
    public function review(Request $request, int $userId)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'action' => 'nullable|in:approve,reject,request_changes,suspend,reactivate,internal_note',
            'approval_status' => 'nullable|in:Approved,Rejected,ChangesRequested,Suspended',
            'rejection_reason' => 'nullable|string|max:2000',
            'reason' => 'nullable|string|max:2000',
            'admin_remarks' => 'nullable|string|max:2000',
            'notes' => 'nullable|string|max:2000',
            'required_changes' => 'nullable|string|max:5000',
            'internal_notes' => 'nullable|string|max:5000',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        if (! $request->filled('action') && ! $request->filled('approval_status')) {
            return $this->validationError([
                'action' => ['Provide an action or approval_status.'],
            ]);
        }

        try {
            $detail = $this->recruiters->review($admin, $userId, $validator->validated());

            return $this->success($detail, 'Recruiter review updated successfully.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->notFound('Recruiter not found.');
        } catch (InvalidArgumentException $e) {
            return $this->validationError(['action' => [$e->getMessage()]]);
        }
    }
}
