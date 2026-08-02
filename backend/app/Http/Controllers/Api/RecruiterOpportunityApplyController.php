<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecruiterApplication;
use App\Models\RecruiterMessage;
use App\Models\RecruiterOpportunity;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\RecruiterApplicationWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RecruiterOpportunityApplyController extends Controller
{
    public function __construct(
        private NotificationService $notifications,
        private RecruiterApplicationWorkflow $workflow,
    ) {
    }

    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        return $token ? User::where('api_token', $token)->first() : null;
    }

    public function index(Request $request)
    {
        $validator = Validator::make($request->query(), [
            'search' => 'nullable|string|max:255',
            'opportunity_type' => 'nullable|in:job,internship,freelance',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $query = RecruiterOpportunity::query()->where('status', 'published')->latest('published_at');
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('skills', 'like', "%{$search}%");
            });
        }
        if ($type = $request->query('opportunity_type')) {
            $query->where('opportunity_type', $type);
        }

        $items = $query->paginate(min((int) $request->query('per_page', 12), 50));
        $items->getCollection()->transform(fn (RecruiterOpportunity $opportunity) => [
            'id' => $opportunity->id,
            'title' => $opportunity->title,
            'company_name' => $opportunity->company_name,
            'location' => $opportunity->location,
            'opportunity_type' => $opportunity->opportunity_type,
            'employment_type' => $opportunity->employment_type,
            'work_mode' => $opportunity->work_mode,
            'experience_level' => $opportunity->experience_level,
            'salary_min' => $opportunity->salary_min,
            'salary_max' => $opportunity->salary_max,
            'skills' => $opportunity->skills,
            'description' => $opportunity->description,
            'contact_visibility' => $opportunity->contact_visibility,
            'published_at' => $opportunity->published_at,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Recruiter opportunities retrieved successfully.',
            'data' => $items,
        ]);
    }

    public function apply(Request $request, int $id)
    {
        $user = $this->authUser($request);
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        if ($user->role !== 'seeker') {
            return response()->json(['success' => false, 'message' => 'Only job seekers can apply.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'message' => 'nullable|string|max:5000',
            'expected_salary' => 'nullable|numeric|min:0',
            'resume' => 'nullable|string|max:500',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $opportunity = RecruiterOpportunity::where('id', $id)->where('status', 'published')->first();
        if (! $opportunity) {
            return response()->json(['success' => false, 'message' => 'Opportunity not found.'], 404);
        }

        if (RecruiterApplication::where('recruiter_opportunity_id', $opportunity->id)->where('candidate_id', $user->id)->exists()) {
            return response()->json(['success' => false, 'message' => 'You have already applied to this opportunity.'], 422);
        }

        $application = DB::transaction(function () use ($request, $user, $opportunity) {
            $application = RecruiterApplication::create([
                'recruiter_opportunity_id' => $opportunity->id,
                'candidate_id' => $user->id,
                'status' => 'new',
                'message' => $request->input('message'),
                'expected_salary' => $request->input('expected_salary'),
                'resume_path' => $request->input('resume') ?: $user->resume_path,
                'applied_at' => now(),
            ]);
            $opportunity->increment('applications_count');
            $this->workflow->logEvent($application, 'applied', $user, 'Candidate applied');

            if ($opportunity->user) {
                $this->notifications->notify(
                    $opportunity->user,
                    'New application received',
                    $user->name . ' applied to ' . $opportunity->title,
                    'application',
                    ['recruiter_application_id' => $application->id]
                );
            }

            return $application;
        });

        return response()->json([
            'success' => true,
            'message' => 'Application submitted successfully.',
            'data' => [
                'id' => $application->id,
                'status' => $application->status,
                'recruiter_opportunity_id' => $application->recruiter_opportunity_id,
                'applied_at' => $application->applied_at,
            ],
            // Compatibility with legacy OpportunitiesHub response shape.
            'application' => [
                'id' => $application->id,
                'opportunityId' => $application->recruiter_opportunity_id,
                'company' => $opportunity->company_name,
                'title' => $opportunity->title,
                'status' => $application->status,
                'appliedAt' => $application->applied_at,
            ],
        ], 201);
    }

    public function myApplications(Request $request)
    {
        $user = $this->authUser($request);
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }
        if ($user->role !== 'seeker') {
            return response()->json(['success' => false, 'message' => 'Only job seekers can view applications.'], 403);
        }

        $items = RecruiterApplication::with(['opportunity.user'])
            ->where('candidate_id', $user->id)
            ->latest('applied_at')
            ->paginate(min((int) $request->query('per_page', 50), 100));

        $items->getCollection()->transform(function (RecruiterApplication $application) {
            $opportunity = $application->opportunity;
            $salaryMin = $opportunity?->salary_min;
            $salaryMax = $opportunity?->salary_max;
            $salary = null;
            if ($salaryMin !== null || $salaryMax !== null) {
                $min = $salaryMin !== null ? '₹' . number_format((float) $salaryMin, 0) : null;
                $max = $salaryMax !== null ? '₹' . number_format((float) $salaryMax, 0) : null;
                $salary = $min && $max ? "{$min}–{$max}" : ($min ?: $max);
            }

            $workMode = $opportunity?->work_mode;
            $workType = match (strtolower((string) $workMode)) {
                'remote' => 'Remote',
                'hybrid' => 'Hybrid',
                'onsite', 'on-site', 'on_site' => 'Onsite',
                default => $workMode ?: 'Onsite',
            };

            $employmentType = match (strtolower((string) ($opportunity?->employment_type ?? ''))) {
                'full-time', 'full_time', 'fulltime' => 'Full Time',
                'part-time', 'part_time', 'parttime' => 'Part Time',
                'internship', 'intern' => 'Internship',
                'contract' => 'Contract',
                'freelance' => 'Freelance',
                default => $opportunity?->employment_type ?: (
                    $opportunity?->opportunity_type === 'internship' ? 'Internship' : 'Full Time'
                ),
            };

            $interviewDate = null;
            if ($application->interview_at) {
                $interviewDate = $application->interview_at->format('Y-m-d \a\t g:i A');
            }

            return [
                'id' => (string) $application->id,
                'opportunityId' => (string) $application->recruiter_opportunity_id,
                'source' => 'recruiter',
                'opportunityType' => $opportunity?->opportunity_type,
                'category' => match ($opportunity?->opportunity_type) {
                    'internship' => 'internships',
                    'freelance' => 'freelance',
                    default => 'jobs',
                },
                'company' => $opportunity?->company_name,
                'recruiter' => $opportunity?->user?->name,
                'title' => $opportunity?->title,
                'location' => $opportunity?->location,
                'salary' => $salary,
                'workType' => $workType,
                'jobType' => $employmentType,
                'employmentType' => $employmentType,
                'duration' => $opportunity?->experience_level,
                'status' => $application->status,
                'appliedAt' => optional($application->applied_at)->toISOString(),
                'lastUpdate' => optional($application->updated_at)->toISOString(),
                'interview_status' => $application->interview_status,
                'interview_at' => $application->interview_at,
                'interviewDate' => $interviewDate,
                'rejectionReason' => $application->reject_reason,
                'offerAmount' => null,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Applications retrieved successfully.',
            'data' => $items,
            'applications' => $items->items(),
        ]);
    }

    public function messages(Request $request, int $applicationId)
    {
        $user = $this->authUser($request);
        if (! $user || $user->role !== 'seeker') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $application = RecruiterApplication::with('opportunity')
            ->where('candidate_id', $user->id)
            ->find($applicationId);
        if (! $application) {
            return response()->json(['success' => false, 'message' => 'Application not found.'], 404);
        }

        RecruiterMessage::where('recruiter_application_id', $application->id)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $messages = RecruiterMessage::with(['sender:id,name', 'receiver:id,name'])
            ->where('recruiter_application_id', $application->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn (RecruiterMessage $message) => [
                'id' => $message->id,
                'body' => $message->body,
                'attachment_url' => $message->attachmentUrl(),
                'attachment_name' => $message->attachment_name,
                'is_read' => (bool) $message->is_read,
                'created_at' => $message->created_at,
                'sender' => $message->sender ? ['id' => $message->sender->id, 'name' => $message->sender->name] : null,
            ]);

        return response()->json([
            'success' => true,
            'data' => ['application_id' => $application->id, 'messages' => $messages],
        ]);
    }

    public function sendMessage(Request $request, int $applicationId)
    {
        $user = $this->authUser($request);
        if (! $user || $user->role !== 'seeker') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $application = RecruiterApplication::with('opportunity.user')
            ->where('candidate_id', $user->id)
            ->find($applicationId);
        if (! $application) {
            return response()->json(['success' => false, 'message' => 'Application not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'body' => 'required_without:attachment|nullable|string|max:5000',
            'attachment' => 'nullable|file|max:5120',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $path = null;
        $name = null;
        $mime = null;
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('recruiter/messages', 'public');
            $name = $file->getClientOriginalName();
            $mime = $file->getClientMimeType();
        }

        $receiverId = $application->opportunity?->user_id;
        if (! $receiverId) {
            return response()->json(['success' => false, 'message' => 'Recruiter not found for this opportunity.'], 422);
        }

        $message = RecruiterMessage::create([
            'recruiter_application_id' => $application->id,
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'body' => (string) ($request->input('body') ?? ''),
            'attachment_path' => $path,
            'attachment_name' => $name,
            'attachment_mime' => $mime,
            'is_read' => false,
        ]);

        $this->workflow->logEvent($application, 'message_sent', $user, $message->body ?: 'Attachment sent');
        if ($application->opportunity?->user) {
            $this->notifications->notify(
                $application->opportunity->user,
                'Candidate message received',
                $message->body !== '' ? $message->body : 'You received an attachment.',
                'application',
                [
                    'recruiter_application_id' => $application->id,
                    'message_id' => $message->id,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully.',
            'data' => [
                'id' => $message->id,
                'body' => $message->body,
                'attachment_url' => $message->attachmentUrl(),
                'attachment_name' => $message->attachment_name,
                'created_at' => $message->created_at,
            ],
        ], 201);
    }
}
