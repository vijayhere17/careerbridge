<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Models\RecruiterOpportunity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RecruiterOpportunityController extends RecruiterBaseController
{
    public function index(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->query(), [
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|in:draft,published,closed,archived,paused',
            'type' => 'nullable|string|max:100',
            'opportunity_type' => 'nullable|string|max:100',
            'sort' => 'nullable|in:latest,oldest,title,applications,views,deadline,salary',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $query = RecruiterOpportunity::where('user_id', $user->id)
            ->withCount(['applications', 'unlocks']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('skills', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($type = $request->query('type', $request->query('opportunity_type'))) {
            $query->where('opportunity_type', $type);
        }

        match ($request->query('sort', 'latest')) {
            'oldest' => $query->oldest(),
            'title' => $query->orderBy('title'),
            'applications' => $query->orderByDesc('applications_count'),
            'views' => $query->orderByDesc('views'),
            'deadline' => $query->orderByRaw('application_deadline IS NULL, application_deadline ASC'),
            'salary' => $query->orderByDesc('salary_max'),
            default => $query->latest(),
        };

        $opportunities = $query->paginate(min((int) $request->query('per_page', 12), 100));
        $opportunities->getCollection()->transform(fn (RecruiterOpportunity $opportunity) => $this->transform($opportunity));

        return $this->success($opportunities, 'Opportunities retrieved successfully.');
    }

    public function summary(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $base = RecruiterOpportunity::where('user_id', $user->id);

        return $this->success([
            'total' => (clone $base)->count(),
            'draft' => (clone $base)->where('status', 'draft')->count(),
            'published' => (clone $base)->where('status', 'published')->count(),
            'closed' => (clone $base)->where('status', 'closed')->count(),
            'archived' => (clone $base)->where('status', 'archived')->count(),
            'paused' => (clone $base)->where('status', 'paused')->count(),
            'views' => (int) (clone $base)->sum('views'),
            'applications' => (int) (clone $base)->sum('applications_count'),
        ], 'Opportunity summary retrieved successfully.');
    }

    public function store(Request $request)
    {
        return $this->createOpportunity($request, 'published', 'Opportunity published successfully.');
    }

    public function saveDraft(Request $request)
    {
        return $this->createOpportunity($request, 'draft', 'Draft saved successfully.');
    }

    public function show(Request $request, int $id)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $opportunity = RecruiterOpportunity::where('user_id', $user->id)
            ->withCount(['applications', 'unlocks'])
            ->with(['applications.candidate'])
            ->find($id);

        if (!$opportunity) {
            return $this->notFound('Opportunity not found.');
        }

        return $this->success($this->transform($opportunity, true), 'Opportunity retrieved successfully.');
    }

    public function update(Request $request, int $id)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $opportunity = $this->findOwned($user->id, $id);
        if (!$opportunity) {
            return $this->notFound('Opportunity not found.');
        }

        $validator = Validator::make($request->all(), $this->rules(false));
        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        $status = $data['status'] ?? null;
        unset($data['status']);

        $opportunity->fill($data)->save();

        if ($status) {
            $this->applyStatus($opportunity, $status);
        }

        return $this->success(
            $this->transform($opportunity->fresh()->loadCount(['applications', 'unlocks'])),
            'Opportunity updated successfully.'
        );
    }

    public function destroy(Request $request, int $id)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $opportunity = $this->findOwned($user->id, $id);
        if (!$opportunity) {
            return $this->notFound('Opportunity not found.');
        }

        $opportunity->delete();

        return $this->success(null, 'Opportunity deleted successfully.');
    }

    public function close(Request $request, int $id)
    {
        return $this->transition($request, $id, 'close', 'Opportunity closed successfully.');
    }

    public function publish(Request $request, int $id)
    {
        return $this->transition($request, $id, 'publish', 'Opportunity published successfully.');
    }

    public function draft(Request $request, int $id)
    {
        return $this->transition($request, $id, 'draft', 'Opportunity moved to draft.');
    }

    public function archive(Request $request, int $id)
    {
        return $this->transition($request, $id, 'archive', 'Opportunity archived successfully.');
    }

    public function pause(Request $request, int $id)
    {
        return $this->transition($request, $id, 'pause', 'Opportunity paused successfully.');
    }

    public function reopen(Request $request, int $id)
    {
        return $this->transition($request, $id, 'publish', 'Opportunity reopened successfully.');
    }

    public function duplicate(Request $request, int $id)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $opportunity = $this->findOwned($user->id, $id);
        if (!$opportunity) {
            return $this->notFound('Opportunity not found.');
        }

        $copy = $opportunity->duplicateFor($user->id)->loadCount(['applications', 'unlocks']);

        return $this->success($this->transform($copy), 'Opportunity duplicated successfully.', 201);
    }

    public function bulk(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|distinct',
            'action' => 'required|in:close,reopen,archive,publish,draft,pause,delete,duplicate',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $opportunities = RecruiterOpportunity::where('user_id', $user->id)
            ->whereIn('id', $request->input('ids'))
            ->get();

        $updated = 0;
        $duplicated = 0;

        DB::transaction(function () use ($opportunities, $request, $user, &$updated, &$duplicated) {
            foreach ($opportunities as $opportunity) {
                match ($request->input('action')) {
                    'close' => $opportunity->close(),
                    'reopen', 'publish' => $opportunity->publish(),
                    'draft' => $opportunity->draft(),
                    'archive' => $opportunity->archive(),
                    'pause' => $opportunity->pause(),
                    'delete' => $opportunity->delete(),
                    'duplicate' => $opportunity->duplicateFor($user->id),
                };

                if ($request->input('action') === 'duplicate') {
                    $duplicated++;
                } else {
                    $updated++;
                }
            }
        });

        return $this->success([
            'matched' => $opportunities->count(),
            'updated' => $updated,
            'duplicated' => $duplicated,
        ], 'Bulk action completed successfully.');
    }

    private function createOpportunity(Request $request, string $status, string $message)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), $this->rules(true, $status === 'draft'));
        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();

        $opportunity = RecruiterOpportunity::create(array_merge($data, [
            'user_id' => $user->id,
            'opportunity_type' => $data['opportunity_type'] ?? 'job',
            'title' => $data['title'] ?? 'Untitled Draft',
            'company_name' => $data['company_name'] ?? ($user->company ?: 'Company'),
            'work_mode' => $data['work_mode'] ?? 'Hybrid',
            'contact_visibility' => $data['contact_visibility'] ?? 'locked',
            'status' => $status,
            'views' => 0,
            'applications_count' => 0,
            'unlocks_count' => 0,
            'published_at' => $status === 'published' ? now() : null,
        ]));

        return $this->success(
            $this->transform($opportunity->loadCount(['applications', 'unlocks'])),
            $message,
            201
        );
    }

    private function transition(Request $request, int $id, string $action, string $message)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $opportunity = $this->findOwned($user->id, $id);
        if (!$opportunity) {
            return $this->notFound('Opportunity not found.');
        }

        $opportunity->{$action}();

        return $this->success(
            $this->transform($opportunity->fresh()->loadCount(['applications', 'unlocks'])),
            $message
        );
    }

    private function findOwned(int $userId, int $id): ?RecruiterOpportunity
    {
        return RecruiterOpportunity::where('user_id', $userId)->find($id);
    }

    private function applyStatus(RecruiterOpportunity $opportunity, string $status): void
    {
        match ($status) {
            'published' => $opportunity->publish(),
            'draft' => $opportunity->draft(),
            'closed' => $opportunity->close(),
            'archived' => $opportunity->archive(),
            'paused' => $opportunity->pause(),
        };
    }

    private function rules(bool $creating = true, bool $draft = false): array
    {
        $required = $creating ? 'required' : 'sometimes';
        $draftable = $draft ? 'nullable' : $required;

        return [
            'opportunity_type' => "{$draftable}|string|max:100",
            'title' => "{$draftable}|string|max:255",
            'company_name' => "{$draftable}|string|max:255",
            'location' => 'nullable|string|max:255',
            'employment_type' => 'nullable|string|max:100',
            'experience_level' => 'nullable|string|max:100',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0',
            'application_deadline' => 'nullable|date',
            'skills' => 'nullable|string',
            'description' => 'nullable|string',
            'responsibilities' => 'nullable|string',
            'requirements' => 'nullable|string',
            'benefits' => 'nullable|string',
            'work_mode' => 'nullable|in:Remote,Hybrid,Office',
            'contact_visibility' => 'nullable|in:public,locked',
            'contact_price' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:draft,published,closed,archived,paused',
        ];
    }

    private function transform(RecruiterOpportunity $opportunity, bool $detailed = false): array
    {
        $payload = [
            'id' => $opportunity->id,
            'user_id' => $opportunity->user_id,
            'duplicated_from_id' => $opportunity->duplicated_from_id,
            'opportunity_type' => $opportunity->opportunity_type,
            'title' => $opportunity->title,
            'company_name' => $opportunity->company_name,
            'location' => $opportunity->location,
            'employment_type' => $opportunity->employment_type,
            'experience_level' => $opportunity->experience_level,
            'salary_min' => $opportunity->salary_min !== null ? (float) $opportunity->salary_min : null,
            'salary_max' => $opportunity->salary_max !== null ? (float) $opportunity->salary_max : null,
            'application_deadline' => $opportunity->application_deadline,
            'skills' => $opportunity->skills,
            'description' => $opportunity->description,
            'responsibilities' => $opportunity->responsibilities,
            'requirements' => $opportunity->requirements,
            'benefits' => $opportunity->benefits,
            'work_mode' => $opportunity->work_mode,
            'contact_visibility' => $opportunity->contact_visibility,
            'contact_price' => $opportunity->contact_price !== null ? (float) $opportunity->contact_price : null,
            'status' => $opportunity->status,
            'views' => (int) $opportunity->views,
            'applications_count' => (int) $opportunity->applications_count,
            'unlocks_count' => (int) $opportunity->unlocks_count,
            'published_at' => $opportunity->published_at,
            'closed_at' => $opportunity->closed_at,
            'archived_at' => $opportunity->archived_at,
            'created_at' => $opportunity->created_at,
            'updated_at' => $opportunity->updated_at,
        ];

        if ($detailed && $opportunity->relationLoaded('applications')) {
            $payload['applications'] = $opportunity->applications->map(fn ($application) => [
                'id' => $application->id,
                'status' => $application->status,
                'rating' => $application->rating,
                'applied_at' => $application->applied_at,
                'candidate' => $application->candidate ? [
                    'id' => $application->candidate->id,
                    'name' => $application->candidate->name,
                    'email' => $application->candidate->email,
                    'profile_photo' => $this->mediaUrl($application->candidate->profile_photo),
                ] : null,
            ])->values();
        }

        return $payload;
    }
}
