<?php

namespace App\Services;

use App\Models\RecruiterApplication;
use App\Models\RecruiterContactUnlock;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RecruiterUnlockService
{
    public function __construct(
        private WalletService $wallets,
        private NotificationService $notifications,
    ) {
    }

    /**
     * Unlock candidate contact details for a recruiter-owned application.
     * Per existing business rules, a successful unlock records unlock income
     * and credits the recruiter wallet balance.
     */
    public function unlock(User $recruiter, RecruiterApplication $application): RecruiterContactUnlock
    {
        $opportunity = $application->opportunity;
        if (! $opportunity || (int) $opportunity->user_id !== (int) $recruiter->id) {
            throw new InvalidArgumentException('You do not own this application.');
        }

        return DB::transaction(function () use ($recruiter, $application, $opportunity) {
            $existing = RecruiterContactUnlock::where('recruiter_id', $recruiter->id)
                ->where('candidate_id', $application->candidate_id)
                ->where('recruiter_application_id', $application->id)
                ->whereIn('status', ['earned', 'pending'])
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return $existing->load(['candidate', 'opportunity', 'application']);
            }

            $amount = (float) ($opportunity->contact_price ?? 49);
            if ($amount < 0) {
                $amount = 0;
            }

            $unlock = RecruiterContactUnlock::create([
                'recruiter_id' => $recruiter->id,
                'candidate_id' => $application->candidate_id,
                'recruiter_opportunity_id' => $opportunity->id,
                'recruiter_application_id' => $application->id,
                'amount' => $amount,
                'status' => 'earned',
                'unlocked_at' => now(),
            ]);

            $opportunity->increment('unlocks_count');

            if ($amount > 0) {
                $this->wallets->credit(
                    $recruiter,
                    $amount,
                    'unlock',
                    'Unlock income',
                    ($application->candidate?->name ?? 'Candidate') . ' · ' . ($opportunity->title ?? 'Opportunity'),
                );
            }

            $candidate = $application->candidate;
            if ($candidate) {
                $this->notifications->notify(
                    $candidate,
                    'Your contact details were unlocked',
                    ($recruiter->name ?? 'A recruiter') . ' unlocked your contact details for ' . ($opportunity->title ?? 'an opportunity') . '.',
                    'unlock',
                    [
                        'recruiter_application_id' => $application->id,
                        'recruiter_id' => $recruiter->id,
                        'unlock_id' => $unlock->id,
                    ]
                );
            }

            $this->notifications->notify(
                $recruiter,
                'Unlock income credited',
                '₹' . number_format($amount, 2) . ' unlock income was added for ' . ($candidate?->name ?? 'a candidate') . '.',
                'unlock',
                [
                    'recruiter_application_id' => $application->id,
                    'unlock_id' => $unlock->id,
                    'amount' => $amount,
                ]
            );

            return $unlock->load(['candidate', 'opportunity', 'application']);
        });
    }

    public function hasUnlocked(User $recruiter, int $candidateId, ?int $applicationId = null): bool
    {
        $query = RecruiterContactUnlock::where('recruiter_id', $recruiter->id)
            ->where('candidate_id', $candidateId)
            ->where('status', 'earned');

        if ($applicationId) {
            $query->where(function ($q) use ($applicationId) {
                $q->where('recruiter_application_id', $applicationId)
                    ->orWhereNull('recruiter_application_id');
            });
        }

        return $query->exists();
    }
}
