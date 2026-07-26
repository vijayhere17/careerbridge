<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Models\RecruiterApplication;
use App\Models\RecruiterMessage;
use App\Models\RecruiterOpportunity;
use App\Services\NotificationService;
use App\Services\RecruiterApplicationWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class RecruiterMessageController extends RecruiterBaseController
{
    public function __construct(
        private NotificationService $notifications,
        private RecruiterApplicationWorkflow $workflow,
    ) {
    }

    public function index(Request $request, int $applicationId)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $application = $this->ownedApplication($user->id, $applicationId);
        if (! $application) {
            return $this->notFound('Application not found.');
        }

        RecruiterMessage::where('recruiter_application_id', $application->id)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $messages = RecruiterMessage::with(['sender:id,name,profile_photo', 'receiver:id,name'])
            ->where('recruiter_application_id', $application->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn (RecruiterMessage $message) => $this->transform($message));

        return $this->success([
            'application_id' => $application->id,
            'messages' => $messages,
            'unread_count' => 0,
        ], 'Messages retrieved successfully.');
    }

    public function store(Request $request, int $applicationId)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $application = $this->ownedApplication($user->id, $applicationId);
        if (! $application) {
            return $this->notFound('Application not found.');
        }

        $validator = Validator::make($request->all(), [
            'body' => 'required_without:attachment|nullable|string|max:5000',
            'attachment' => 'nullable|file|max:5120',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
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

        $message = RecruiterMessage::create([
            'recruiter_application_id' => $application->id,
            'sender_id' => $user->id,
            'receiver_id' => $application->candidate_id,
            'body' => (string) ($request->input('body') ?? ''),
            'attachment_path' => $path,
            'attachment_name' => $name,
            'attachment_mime' => $mime,
            'is_read' => false,
        ]);

        $this->workflow->logEvent($application, 'message_sent', $user, $message->body ?: 'Attachment sent');
        if ($application->candidate) {
            $this->notifications->notify(
                $application->candidate,
                'New message from recruiter',
                $message->body !== '' ? $message->body : 'You received an attachment.',
                'application',
                [
                    'recruiter_application_id' => $application->id,
                    'message_id' => $message->id,
                ]
            );
        }

        return $this->success($this->transform($message->load(['sender', 'receiver'])), 'Message sent successfully.', 201);
    }

    public function unreadCount(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $opportunityIds = RecruiterOpportunity::where('user_id', $user->id)->pluck('id');
        $applicationIds = RecruiterApplication::whereIn('recruiter_opportunity_id', $opportunityIds)->pluck('id');
        $count = RecruiterMessage::whereIn('recruiter_application_id', $applicationIds)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();

        return $this->success(['unread_count' => $count], 'Unread message count retrieved.');
    }

    private function ownedApplication(int $recruiterId, int $applicationId): ?RecruiterApplication
    {
        $opportunityIds = RecruiterOpportunity::where('user_id', $recruiterId)->pluck('id');

        return RecruiterApplication::with('candidate')
            ->whereIn('recruiter_opportunity_id', $opportunityIds)
            ->find($applicationId);
    }

    private function transform(RecruiterMessage $message): array
    {
        return [
            'id' => $message->id,
            'recruiter_application_id' => $message->recruiter_application_id,
            'body' => $message->body,
            'attachment_url' => $message->attachmentUrl(),
            'attachment_name' => $message->attachment_name,
            'attachment_mime' => $message->attachment_mime,
            'is_read' => (bool) $message->is_read,
            'read_at' => $message->read_at,
            'created_at' => $message->created_at,
            'sender' => $message->sender ? [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
                'profile_photo' => $this->mediaUrl($message->sender->profile_photo),
            ] : null,
            'receiver' => $message->receiver ? [
                'id' => $message->receiver->id,
                'name' => $message->receiver->name,
            ] : null,
        ];
    }
}
