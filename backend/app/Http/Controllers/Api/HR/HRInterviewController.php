<?php

namespace App\Http\Controllers\Api\HR;

use App\Models\HRApplication;
use App\Models\HRInterview;
use App\Models\HRJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HRInterviewController extends HRBaseController
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

        $query = HRInterview::with(['application.candidate', 'application.job'])
            ->where('hr_id', $user->id);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($request->query('upcoming') === '1') {
            $query->where('status', 'scheduled')
                ->where('scheduled_at', '>=', now());
        }

        if ($from = $request->query('from')) {
            $query->whereDate('scheduled_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->whereDate('scheduled_at', '<=', $to);
        }

        $perPage = min((int) $request->query('per_page', 20), 100);
        $interviews = $query->orderBy('scheduled_at')->paginate($perPage);

        $interviews->getCollection()->transform(fn (HRInterview $i) => $this->transform($i));

        return $this->success($interviews);
    }

    public function store(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $validator = Validator::make($request->all(), [
            'application_id' => 'required|exists:hr_applications,id',
            'interviewer_name' => 'nullable|string|max:255',
            'interview_type' => 'nullable|string|max:100',
            'meeting_link' => 'nullable|string|max:500',
            'scheduled_at' => 'required|date',
            'duration' => 'nullable|integer|min:15|max:240',
            'status' => 'nullable|in:scheduled,completed,cancelled,no_show',
            'feedback' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $jobIds = HRJob::where('hr_id', $user->id)->pluck('id');
        $application = HRApplication::whereIn('job_id', $jobIds)->find($request->application_id);

        if (!$application) {
            return $this->forbidden('Application not found in your jobs.');
        }

        $interview = HRInterview::create([
            'application_id' => $application->id,
            'hr_id' => $user->id,
            'interviewer_name' => $request->interviewer_name,
            'interview_type' => $request->interview_type,
            'meeting_link' => $request->meeting_link,
            'scheduled_at' => $request->scheduled_at,
            'duration' => $request->duration ?? 30,
            'status' => $request->status ?? 'scheduled',
            'feedback' => $request->feedback,
        ]);

        $application->forceFill([
            'interview_date' => $interview->scheduled_at,
            'interview_mode' => $interview->interview_type,
            'interview_link' => $interview->meeting_link,
        ])->save();

        $interview->load(['application.candidate', 'application.job']);
        $this->logActivity($user, 'scheduled', 'interviews', "Scheduled interview #{$interview->id}");

        return $this->success($this->transform($interview), 'Interview scheduled.', 201);
    }

    public function show(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $interview = HRInterview::with(['application.candidate', 'application.job'])
            ->where('hr_id', $user->id)
            ->find($id);

        if (!$interview) {
            return $this->notFound('Interview not found.');
        }

        return $this->success($this->transform($interview));
    }

    public function update(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $interview = HRInterview::where('hr_id', $user->id)->find($id);

        if (!$interview) {
            return $this->notFound('Interview not found.');
        }

        $validator = Validator::make($request->all(), [
            'interviewer_name' => 'nullable|string|max:255',
            'interview_type' => 'nullable|string|max:100',
            'meeting_link' => 'nullable|string|max:500',
            'scheduled_at' => 'nullable|date',
            'duration' => 'nullable|integer|min:15|max:240',
            'status' => 'nullable|in:scheduled,completed,cancelled,no_show',
            'feedback' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $interview->fill($validator->validated())->save();
        $interview->load(['application.candidate', 'application.job']);

        $this->logActivity($user, 'updated', 'interviews', "Updated interview #{$interview->id}");

        return $this->success($this->transform($interview), 'Interview updated.');
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return $this->unauthorized();
        }

        $interview = HRInterview::where('hr_id', $user->id)->find($id);

        if (!$interview) {
            return $this->notFound('Interview not found.');
        }

        $interview->delete();
        $this->logActivity($user, 'deleted', 'interviews', "Deleted interview #{$id}");

        return $this->success(null, 'Interview cancelled.');
    }

    private function transform(HRInterview $interview): array
    {
        return [
            'id' => $interview->id,
            'application_id' => $interview->application_id,
            'hr_id' => $interview->hr_id,
            'interviewer_name' => $interview->interviewer_name,
            'interview_type' => $interview->interview_type,
            'meeting_link' => $interview->meeting_link,
            'scheduled_at' => $interview->scheduled_at,
            'duration' => $interview->duration,
            'status' => $interview->status,
            'feedback' => $interview->feedback,
            'created_at' => $interview->created_at,
            'updated_at' => $interview->updated_at,
            'candidate' => $interview->application?->candidate ? [
                'id' => $interview->application->candidate->id,
                'name' => $interview->application->candidate->name,
                'email' => $interview->application->candidate->email,
                'profile_photo' => $this->mediaUrl($interview->application->candidate->profile_photo),
            ] : null,
            'job' => $interview->application?->job ? [
                'id' => $interview->application->job->id,
                'title' => $interview->application->job->title,
                'department' => $interview->application->job->department,
            ] : null,
        ];
    }
}
