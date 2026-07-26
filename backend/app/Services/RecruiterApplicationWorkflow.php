<?php

namespace App\Services;

use App\Models\RecruiterApplication;
use App\Models\RecruiterApplicationEvent;
use App\Models\RecruiterOpportunity;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RecruiterApplicationWorkflow
{
    public const STATUSES = [
        'new',
        'under_review',
        'shortlisted',
        'interview',
        'interview_completed',
        'accepted',
        'rejected',
        'withdrawn',
        'hired',
        'completed',
    ];

    public function __construct(private NotificationService $notifications)
    {
    }

    public function transition(
        RecruiterApplication $application,
        string $toStatus,
        ?User $actor = null,
        ?string $note = null,
        array $extra = [],
        string $event = 'status_changed',
    ): RecruiterApplication {
        if (! in_array($toStatus, self::STATUSES, true)) {
            abort(422, 'Invalid application status.');
        }

        return DB::transaction(function () use ($application, $toStatus, $actor, $note, $extra, $event) {
            $from = $application->status;
            $payload = array_merge(['status' => $toStatus], $extra);

            if ($toStatus === 'hired' && empty($payload['hired_at'])) {
                $payload['hired_at'] = now();
            }
            if ($toStatus === 'completed' && empty($payload['completed_at'])) {
                $payload['completed_at'] = now();
            }
            if ($toStatus === 'interview' && empty($payload['interview_status'])) {
                $payload['interview_status'] = $application->interview_status ?: 'scheduled';
            }
            if ($toStatus === 'interview_completed') {
                $payload['interview_status'] = 'completed';
            }

            $application->forceFill($payload)->save();

            RecruiterApplicationEvent::create([
                'recruiter_application_id' => $application->id,
                'actor_id' => $actor?->id,
                'event' => $event,
                'from_status' => $from,
                'to_status' => $toStatus,
                'note' => $note,
                'meta' => $extra ?: null,
            ]);

            $this->notifyCandidate($application->fresh(['candidate', 'opportunity']), $toStatus, $note);

            if (in_array($toStatus, ['hired', 'completed'], true)) {
                $this->maybeCloseOpportunity($application->opportunity);
            }

            return $application->fresh(['candidate', 'opportunity']);
        });
    }

    public function logEvent(
        RecruiterApplication $application,
        string $event,
        ?User $actor = null,
        ?string $note = null,
        array $meta = [],
    ): void {
        RecruiterApplicationEvent::create([
            'recruiter_application_id' => $application->id,
            'actor_id' => $actor?->id,
            'event' => $event,
            'from_status' => $application->status,
            'to_status' => $application->status,
            'note' => $note,
            'meta' => $meta ?: null,
        ]);
    }

    private function notifyCandidate(RecruiterApplication $application, string $status, ?string $note): void
    {
        $candidate = $application->candidate;
        if (! $candidate) {
            return;
        }

        $title = match ($status) {
            'under_review' => 'Application under review',
            'shortlisted' => 'You were shortlisted',
            'interview' => 'Interview scheduled',
            'interview_completed' => 'Interview marked completed',
            'accepted' => 'Application accepted',
            'rejected' => 'Application update',
            'hired' => 'Congratulations — you were hired',
            'completed' => 'Opportunity marked completed',
            'withdrawn' => 'Application withdrawn',
            default => 'Application updated',
        };

        $message = 'Your application for '
            . ($application->opportunity?->title ?? 'an opportunity')
            . ' is now "' . str_replace('_', ' ', $status) . '".'
            . ($note ? ' Note: ' . $note : '');

        $this->notifications->notify($candidate, $title, $message, 'application', [
            'recruiter_application_id' => $application->id,
            'status' => $status,
        ]);
    }

    private function maybeCloseOpportunity(?RecruiterOpportunity $opportunity): void
    {
        if (! $opportunity || $opportunity->status === 'closed') {
            return;
        }

        // Auto-close when opportunity type is a single hire/project and at least one hire exists.
        $hasHire = $opportunity->applications()
            ->whereIn('status', ['hired', 'completed'])
            ->exists();

        if ($hasHire && in_array($opportunity->opportunity_type, ['freelance', 'internship', 'job'], true)) {
            // Keep open for jobs by default; close freelance after hire.
            if ($opportunity->opportunity_type === 'freelance') {
                $opportunity->forceFill([
                    'status' => 'closed',
                    'closed_at' => now(),
                ])->save();
            }
        }
    }
}
