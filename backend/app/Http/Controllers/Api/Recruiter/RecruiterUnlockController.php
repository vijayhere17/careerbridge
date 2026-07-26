<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Models\RecruiterApplication;
use App\Models\RecruiterContactUnlock;
use App\Models\RecruiterOpportunity;
use App\Services\RecruiterUnlockService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

class RecruiterUnlockController extends RecruiterBaseController
{
    public function __construct(private RecruiterUnlockService $unlockService)
    {
    }

    public function store(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'recruiter_application_id' => 'required|integer|exists:recruiter_applications,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $application = RecruiterApplication::with(['candidate', 'opportunity'])
            ->find($request->input('recruiter_application_id'));

        if (! $application || (int) $application->opportunity?->user_id !== (int) $user->id) {
            return $this->forbidden('You do not own this application.');
        }

        try {
            $unlock = $this->unlockService->unlock($user, $application);
        } catch (InvalidArgumentException $e) {
            return $this->validationError(['unlock' => [$e->getMessage()]]);
        }

        return $this->success($this->transform($unlock), 'Candidate contact unlocked successfully.', 201);
    }

    public function index(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->query(), [
            'status' => 'nullable|in:earned,pending,refunded',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'opportunity_id' => 'nullable|integer',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $query = RecruiterContactUnlock::where('recruiter_id', $user->id)
            ->with(['candidate', 'opportunity', 'application']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($from = $request->query('from')) {
            $query->whereDate('unlocked_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->whereDate('unlocked_at', '<=', $to);
        }

        if ($opportunityId = $request->query('opportunity_id')) {
            $query->where('recruiter_opportunity_id', $opportunityId);
        }

        $unlocks = $query->latest('unlocked_at')
            ->paginate(min((int) $request->query('per_page', 20), 100));
        $unlocks->getCollection()->transform(fn (RecruiterContactUnlock $unlock) => $this->transform($unlock));

        return $this->success($unlocks, 'Unlocks retrieved successfully.');
    }

    public function stats(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $unlocks = RecruiterContactUnlock::where('recruiter_id', $user->id);
        $earned = RecruiterContactUnlock::where('recruiter_id', $user->id)->where('status', 'earned');

        return $this->success([
            'total' => [
                'count' => (clone $unlocks)->count(),
                'amount' => (float) (clone $earned)->sum('amount'),
            ],
            'today' => [
                'count' => (clone $unlocks)->whereDate('unlocked_at', Carbon::today())->count(),
                'amount' => (float) (clone $earned)->whereDate('unlocked_at', Carbon::today())->sum('amount'),
            ],
            'monthly' => [
                'count' => (clone $unlocks)
                    ->whereMonth('unlocked_at', now()->month)
                    ->whereYear('unlocked_at', now()->year)
                    ->count(),
                'amount' => (float) (clone $earned)
                    ->whereMonth('unlocked_at', now()->month)
                    ->whereYear('unlocked_at', now()->year)
                    ->sum('amount'),
            ],
            'by_status' => [
                'earned' => RecruiterContactUnlock::where('recruiter_id', $user->id)->where('status', 'earned')->count(),
                'pending' => RecruiterContactUnlock::where('recruiter_id', $user->id)->where('status', 'pending')->count(),
                'refunded' => RecruiterContactUnlock::where('recruiter_id', $user->id)->where('status', 'refunded')->count(),
            ],
        ], 'Unlock stats retrieved successfully.');
    }

    public function chart(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->query(), [
            'days' => 'nullable|integer|in:7,30',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $days = (int) $request->query('days', 7);
        $chart = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $query = RecruiterContactUnlock::where('recruiter_id', $user->id)
                ->where('status', 'earned')
                ->whereDate('unlocked_at', $date);

            $chart[] = [
                'date' => $date->toDateString(),
                'label' => $date->format('M d'),
                'count' => (clone $query)->count(),
                'amount' => (float) (clone $query)->sum('amount'),
            ];
        }

        return $this->success([
            'days' => $days,
            'chart' => $chart,
        ], 'Unlock chart retrieved successfully.');
    }

    private function transform(RecruiterContactUnlock $unlock): array
    {
        return [
            'id' => $unlock->id,
            'recruiter_id' => $unlock->recruiter_id,
            'candidate_id' => $unlock->candidate_id,
            'recruiter_opportunity_id' => $unlock->recruiter_opportunity_id,
            'recruiter_application_id' => $unlock->recruiter_application_id,
            'amount' => (float) $unlock->amount,
            'status' => $unlock->status,
            'unlocked_at' => $unlock->unlocked_at,
            'created_at' => $unlock->created_at,
            'candidate' => $unlock->candidate ? [
                'id' => $unlock->candidate->id,
                'name' => $unlock->candidate->name,
                'email' => $unlock->candidate->email,
                'mobile' => $unlock->candidate->mobile,
                'profile_photo' => $this->mediaUrl($unlock->candidate->profile_photo),
                'location' => $unlock->candidate->location,
            ] : null,
            'opportunity' => $unlock->opportunity ? [
                'id' => $unlock->opportunity->id,
                'title' => $unlock->opportunity->title,
                'company_name' => $unlock->opportunity->company_name,
                'status' => $unlock->opportunity->status,
            ] : null,
            'application' => $unlock->application ? [
                'id' => $unlock->application->id,
                'status' => $unlock->application->status,
                'applied_at' => $unlock->application->applied_at,
            ] : null,
        ];
    }
}
