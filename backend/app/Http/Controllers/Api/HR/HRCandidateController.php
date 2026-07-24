<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRApplication;
use App\Models\HRCandidateNote;
use App\Models\HRInterview;
use App\Models\HRJob;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HRCandidateController extends HRBaseController
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

        $jobIds = HRJob::where('hr_id', $user->id)->pluck('id');

        $candidateIds = HRApplication::whereIn('job_id', $jobIds)
            ->pluck('candidate_id')
            ->unique()
            ->values();

        $query = User::whereIn('id', $candidateIds);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->query('per_page', 15), 50);
        $candidates = $query->latest()->paginate($perPage);

        $candidates->getCollection()->transform(function (User $candidate) use ($jobIds) {
            $apps = HRApplication::with('job')
                ->where('candidate_id', $candidate->id)
                ->whereIn('job_id', $jobIds)
                ->get();

            return [
                'id' => $candidate->id,
                'name' => $candidate->name,
                'email' => $candidate->email,
                'mobile' => $candidate->mobile,
                'location' => $candidate->location,
                'experience' => $candidate->experience,
                'education' => $candidate->education,
                'skills' => $candidate->skills,
                'profile_photo' => $this->mediaUrl($candidate->profile_photo),
                'applications_count' => $apps->count(),
                'latest_stage' => $apps->sortByDesc('updated_at')->first()?->current_stage,
                'avg_rating' => round((float) $apps->avg('rating'), 1),
            ];
        });

        return $this->success($candidates);
    }

    public function show(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        if (!$this->ensureHrAccess($user)) {
            return $this->forbidden('HR access required.');
        }

        $jobIds = HRJob::where('hr_id', $user->id)->pluck('id');
        $hasAccess = HRApplication::where('candidate_id', $id)
            ->whereIn('job_id', $jobIds)
            ->exists();

        if (!$hasAccess && $user->role !== 'admin') {
            return $this->forbidden('Candidate not in your pipeline.');
        }

        $candidate = User::find($id);

        if (!$candidate) {
            return $this->notFound('Candidate not found.');
        }

        $applications = HRApplication::with('job')
            ->where('candidate_id', $id)
            ->whereIn('job_id', $jobIds)
            ->latest()
            ->get();

        $applicationIds = $applications->pluck('id');

        $interviews = HRInterview::where('hr_id', $user->id)
            ->whereIn('application_id', $applicationIds)
            ->orderByDesc('scheduled_at')
            ->get();

        $notes = HRCandidateNote::where('hr_id', $user->id)
            ->where('candidate_id', $id)
            ->latest()
            ->get();

        return $this->success([
            'candidate' => [
                'id' => $candidate->id,
                'name' => $candidate->name,
                'email' => $candidate->email,
                'mobile' => $candidate->mobile,
                'company' => $candidate->company,
                'current_role' => $candidate->current_role,
                'target_roles' => $candidate->target_roles,
                'location' => $candidate->location,
                'bio' => $candidate->bio,
                'experience' => $candidate->experience,
                'education' => $candidate->education,
                'skills' => $candidate->skills,
                'linkedin' => $candidate->linkedin,
                'github' => $candidate->github,
                'portfolio' => $candidate->portfolio,
                'looking_for' => $candidate->looking_for,
                'profile_photo' => $this->mediaUrl($candidate->profile_photo),
            ],
            'applications' => $applications,
            'interviews' => $interviews,
            'notes' => $notes,
            'ratings' => [
                'average' => round((float) $applications->avg('rating'), 1),
                'count' => $applications->whereNotNull('rating')->count(),
            ],
        ]);
    }

    public function storeNote(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $validator = Validator::make($request->all(), [
            'note' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $jobIds = HRJob::where('hr_id', $user->id)->pluck('id');
        $hasAccess = HRApplication::where('candidate_id', $id)
            ->whereIn('job_id', $jobIds)
            ->exists();

        if (!$hasAccess) {
            return $this->forbidden('Candidate not in your pipeline.');
        }

        $note = HRCandidateNote::create([
            'hr_id' => $user->id,
            'candidate_id' => $id,
            'note' => $request->note,
        ]);

        $this->logActivity($user, 'created', 'notes', "Added note for candidate #{$id}");

        return $this->success($note, 'Note added.', 201);
    }

    public function destroyNote(Request $request, int $candidateId, int $noteId)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $note = HRCandidateNote::where('hr_id', $user->id)
            ->where('candidate_id', $candidateId)
            ->find($noteId);

        if (!$note) {
            return $this->notFound('Note not found.');
        }

        $note->delete();

        return $this->success(null, 'Note deleted.');
    }
}
