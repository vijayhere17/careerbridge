<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class HRJobController extends HRBaseController
{
    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $query = HRJob::where('hr_id', $user->id)->withCount('applications');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($department = $request->query('department')) {
            $query->where('department', $department);
        }

        if ($employmentType = $request->query('employment_type')) {
            $query->where('employment_type', $employmentType);
        }

        $sort = $request->query('sort', 'latest');
        match ($sort) {
            'title' => $query->orderBy('title'),
            'oldest' => $query->oldest(),
            'applications' => $query->orderByDesc('applications_count'),
            'salary' => $query->orderByDesc('salary_max'),
            default => $query->latest(),
        };

        $perPage = min((int) $request->query('per_page', 12), 50);
        $jobs = $query->paginate($perPage);

        return $this->success($jobs);
    }

    public function store(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $validator = Validator::make($request->all(), $this->rules());

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $status = $data['status'] ?? 'draft';

        $job = HRJob::create([
            'hr_id' => $user->id,
            'recruiter_opportunity_id' => $data['recruiter_opportunity_id'] ?? null,
            'title' => $data['title'],
            'department' => $data['department'] ?? null,
            'location' => $data['location'] ?? null,
            'employment_type' => $data['employment_type'] ?? null,
            'experience' => $data['experience'] ?? null,
            'salary_min' => $data['salary_min'] ?? null,
            'salary_max' => $data['salary_max'] ?? null,
            'openings' => $data['openings'] ?? 1,
            'status' => $status,
            'description' => $data['description'] ?? null,
            'requirements' => $data['requirements'] ?? null,
            'responsibilities' => $data['responsibilities'] ?? null,
            'published_at' => $status === 'open' ? now() : null,
        ]);

        $this->logActivity($user, 'created', 'jobs', "Created job: {$job->title}");

        return $this->success($job->loadCount('applications'), 'Job created successfully.', 201);
    }

    public function show(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $job = HRJob::where('hr_id', $user->id)
            ->withCount('applications')
            ->with(['applications.candidate'])
            ->find($id);

        if (!$job) {
            return $this->notFound('Job not found.');
        }

        return $this->success($job);
    }

    public function update(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $job = HRJob::where('hr_id', $user->id)->find($id);

        if (!$job) {
            return $this->notFound('Job not found.');
        }

        $validator = Validator::make($request->all(), $this->rules(false));

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $previousStatus = $job->status;
        $job->fill($data);

        if (isset($data['status']) && $data['status'] === 'open' && $previousStatus !== 'open') {
            $job->published_at = $job->published_at ?? now();
            $job->closed_at = null;
            $job->archived_at = null;
        }

        if (isset($data['status']) && $data['status'] === 'closed' && $previousStatus !== 'closed') {
            $job->closed_at = now();
        }

        if (isset($data['status']) && $data['status'] === 'archived') {
            $job->archived_at = now();
            $job->closed_at = $job->closed_at ?? now();
        }

        $job->save();
        $this->logActivity($user, 'updated', 'jobs', "Updated job: {$job->title}");

        return $this->success($job->loadCount('applications'), 'Job updated successfully.');
    }

    public function close(Request $request, int $id)
    {
        return $this->transition($request, $id, 'close', 'Job closed successfully.');
    }

    public function reopen(Request $request, int $id)
    {
        return $this->transition($request, $id, 'reopen', 'Job reopened successfully.');
    }

    public function archive(Request $request, int $id)
    {
        return $this->transition($request, $id, 'archive', 'Job archived successfully.');
    }

    public function publish(Request $request, int $id)
    {
        return $this->transition($request, $id, 'publish', 'Job published successfully.');
    }

    public function draft(Request $request, int $id)
    {
        return $this->transition($request, $id, 'draft', 'Job moved to draft.');
    }

    public function duplicate(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $job = HRJob::where('hr_id', $user->id)->find($id);

        if (!$job) {
            return $this->notFound('Job not found.');
        }

        $copy = $job->duplicateFor($user->id);
        $this->logActivity($user, 'duplicated', 'jobs', "Duplicated job: {$job->title}");

        return $this->success($copy->loadCount('applications'), 'Job duplicated.', 201);
    }

    public function bulk(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
            'action' => 'required|in:close,reopen,archive,publish,draft,delete',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $jobs = HRJob::where('hr_id', $user->id)->whereIn('id', $request->ids)->get();
        $count = 0;

        DB::transaction(function () use ($jobs, $request, &$count) {
            foreach ($jobs as $job) {
                match ($request->action) {
                    'close' => $job->close(),
                    'reopen' => $job->reopen(),
                    'archive' => $job->archive(),
                    'publish' => $job->publish(),
                    'draft' => $job->draft(),
                    'delete' => $job->delete(),
                };
                $count++;
            }
        });

        $this->logActivity($user, 'bulk_' . $request->action, 'jobs', "Bulk {$request->action} on {$count} jobs");

        return $this->success(['updated' => $count], 'Bulk action completed.');
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $job = HRJob::where('hr_id', $user->id)->find($id);

        if (!$job) {
            return $this->notFound('Job not found.');
        }

        $title = $job->title;
        $job->delete();
        $this->logActivity($user, 'deleted', 'jobs', "Deleted job: {$title}");

        return $this->success(null, 'Job deleted successfully.');
    }

    private function transition(Request $request, int $id, string $action, string $message)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $job = HRJob::where('hr_id', $user->id)->find($id);

        if (!$job) {
            return $this->notFound('Job not found.');
        }

        $job->{$action}();
        $this->logActivity($user, $action, 'jobs', ucfirst($action) . " job: {$job->title}");

        return $this->success($job->fresh()->loadCount('applications'), $message);
    }

    private function rules(bool $creating = true): array
    {
        return [
            'title' => ($creating ? 'required' : 'sometimes') . '|string|max:255',
            'department' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'employment_type' => 'nullable|string|max:100',
            'experience' => 'nullable|string|max:100',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'openings' => 'nullable|integer|min:1|max:500',
            'status' => 'nullable|in:draft,open,closed,on_hold,archived',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'responsibilities' => 'nullable|string',
            'recruiter_opportunity_id' => 'nullable|exists:recruiter_opportunities,id',
        ];
    }
}
