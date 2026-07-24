<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRJob;
use Illuminate\Http\Request;
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

        $query = HRJob::where('hr_id', $user->id)
            ->withCount('applications');

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

        $perPage = min((int) $request->query('per_page', 12), 50);
        $jobs = $query->latest()->paginate($perPage);

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

        return $this->success($job, 'Job created successfully.', 201);
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
        }

        if (isset($data['status']) && $data['status'] === 'closed' && $previousStatus !== 'closed') {
            $job->closed_at = now();
        }

        $job->save();

        $this->logActivity($user, 'updated', 'jobs', "Updated job: {$job->title}");

        return $this->success($job, 'Job updated successfully.');
    }

    public function close(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $job = HRJob::where('hr_id', $user->id)->find($id);

        if (!$job) {
            return $this->notFound('Job not found.');
        }

        $job->close();
        $this->logActivity($user, 'closed', 'jobs', "Closed job: {$job->title}");

        return $this->success($job, 'Job closed successfully.');
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
            'status' => 'nullable|in:draft,open,closed,on_hold',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'responsibilities' => 'nullable|string',
            'recruiter_opportunity_id' => 'nullable|exists:recruiter_opportunities,id',
        ];
    }
}
