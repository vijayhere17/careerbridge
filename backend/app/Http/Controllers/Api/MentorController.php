<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveMentorRequest;
use App\Http\Requests\StoreMentorBookingRequest;
use App\Http\Resources\MentorBookingResource;
use App\Http\Resources\MentorResource;
use App\Http\Resources\MentorReviewResource;
use App\Http\Resources\MentorServiceResource;
use App\Models\MentorAvailability;
use App\Models\MentorBooking;
use App\Models\MentorProfile;
use App\Models\MentorReview;
use App\Models\MentorService;
use App\Models\SavedMentor;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\WalletService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class MentorController extends Controller
{
    // ── PUBLIC: List mentors with search & filters ──────────────────────────

    public function index(Request $request)
    {
        $query = MentorProfile::query()
            ->with([
                'user',
                'services' => fn ($q) => $q->where('status', 'active'),
                'skills',
                'languages',
                'reviews',
            ])
            ->where('onboarding_status', 'approved')
            ->where('verified', true);

        if ($q = $request->query('q')) {
            $query->where(function ($b) use ($q) {
                $b->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%"))
                    ->orWhere('company', 'like', "%{$q}%")
                    ->orWhere('designation', 'like', "%{$q}%")
                    ->orWhere('bio', 'like', "%{$q}%")
                    ->orWhereHas('skills', fn ($s) => $s->where('skill', 'like', "%{$q}%"));
            });
        }

        if ($industry = $request->query('industry')) {
            $query->where('industry', $industry);
        }

        if ($company = $request->query('company')) {
            $query->where('company', 'like', "%{$company}%");
        }

        if ($skill = $request->query('skill')) {
            $query->whereHas('skills', fn ($b) => $b->where('skill', 'like', "%{$skill}%"));
        }

        if ($language = $request->query('language')) {
            $query->whereHas('languages', fn ($b) => $b->where('language', $language));
        }

        if ($request->boolean('availableOnly')) {
            $query->where('available', true);
        }

        if ($request->boolean('verifiedOnly')) {
            $query->where('verified', true);
        }

        $sort = $request->query('sort', 'rating');
        match ($sort) {
            'sessions'   => $query->orderByDesc('session_count'),
            'price_asc'  => $query->withMin('services', 'price')->orderBy('services_min_price'),
            'price_desc' => $query->withMin('services', 'price')->orderByDesc('services_min_price'),
            default      => $query->orderByDesc('rating'),
        };

        return response()->json([
            'mentors' => MentorResource::collection($query->get()),
        ]);
    }

    // ── PUBLIC: Single mentor ────────────────────────────────────────────────

    public function show(MentorProfile $mentor)
    {
        if ($mentor->onboarding_status !== 'approved' || ! $mentor->verified) {
            return response()->json(['message' => 'Mentor not found.'], 404);
        }

        $mentor->load(['user', 'services', 'skills', 'languages', 'reviews']);

        return response()->json([
            'mentor' => new MentorResource($mentor),
        ]);
    }

    public function services(MentorProfile $mentor)
    {
        $mentor->load(['services' => fn ($q) => $q->where('status', 'active')]);

        return response()->json([
            'services' => MentorServiceResource::collection($mentor->services),
        ]);
    }

    public function reviews(MentorProfile $mentor)
    {
        $mentor->load(['reviews' => fn ($q) => $q->latest()]);

        return response()->json([
            'reviews' => MentorReviewResource::collection($mentor->reviews),
        ]);
    }

    // ── CANDIDATE: Save / Unsave / List saved mentors ───────────────────────

    public function save(SaveMentorRequest $request)
    {
        $user = $this->auth($request);
        if (! $user || $user->role !== 'seeker') {
            return response()->json(['message' => 'Only candidates can save mentors.'], 403);
        }

        $mentor = MentorProfile::findOrFail($request->input('mentor_id'));
        $saved  = SavedMentor::firstOrCreate([
            'candidate_id' => $user->id,
            'mentor_id'    => $mentor->id,
        ]);

        return response()->json([
            'saved'  => true,
            'mentor' => new MentorResource($mentor),
        ], $saved->wasRecentlyCreated ? 201 : 200);
    }

    public function destroySave(Request $request, MentorProfile $mentor)
    {
        $user = $this->auth($request);
        if (! $user || $user->role !== 'seeker') {
            return response()->json(['message' => 'Only candidates can manage saved mentors.'], 403);
        }

        SavedMentor::where('candidate_id', $user->id)->where('mentor_id', $mentor->id)->delete();

        return response()->json(['message' => 'Removed from saved list.']);
    }

    public function saved(Request $request)
    {
        $user = $this->auth($request);
        if (! $user || $user->role !== 'seeker') {
            return response()->json(['message' => 'Only candidates can view saved mentors.'], 403);
        }

        $ids     = SavedMentor::where('candidate_id', $user->id)->pluck('mentor_id');
        $mentors = MentorProfile::with([
            'user',
            'services' => fn ($q) => $q->where('status', 'active'),
            'skills',
            'languages',
            'reviews',
        ])->whereIn('id', $ids)->get();

        return response()->json([
            'mentors' => MentorResource::collection($mentors),
        ]);
    }

    // ── CANDIDATE: Bookings ──────────────────────────────────────────────────

    public function bookings(Request $request)
    {
        $user = $this->auth($request);
        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $query = MentorBooking::query()->with(['mentor.user', 'service', 'candidate']);

        if ($user->role === 'mentor') {
            $mentor = MentorProfile::where('user_id', $user->id)->first();
            $mentor
                ? $query->where('mentor_id', $mentor->id)
                : $query->whereRaw('1=0');
        } else {
            $query->where('candidate_id', $user->id);
        }

        return response()->json([
            'bookings' => MentorBookingResource::collection(
                $query->orderByDesc('created_at')->get()
            ),
        ]);
    }

    public function storeBooking(StoreMentorBookingRequest $request)
    {
        $user = $this->auth($request);
        if (! $user || $user->role !== 'seeker') {
            return response()->json(['message' => 'Only candidates can book sessions.'], 403);
        }

        $mentor  = MentorProfile::with('user')->findOrFail($request->input('mentor_id'));
        $service = MentorService::findOrFail($request->input('service_id'));

        if ($mentor->onboarding_status !== 'approved' || ! $mentor->verified) {
            return response()->json(['message' => 'This mentor is not available for booking.'], 422);
        }

        if ((int) $service->mentor_id !== (int) $mentor->id || $service->status !== 'active') {
            return response()->json(['message' => 'Selected service is not available.'], 422);
        }

        $amount = (float) $request->input('amount', $service->price);
        if ($amount <= 0) {
            $amount = (float) $service->price;
        }

        $walletService = app(WalletService::class);
        $notifications = app(NotificationService::class);

        try {
            $booking = DB::transaction(function () use (
                $user, $mentor, $service, $request, $amount, $walletService, $notifications
            ) {
                $booking = MentorBooking::create([
                    'mentor_id' => $mentor->id,
                    'candidate_id' => $user->id,
                    'service_id' => $service->id,
                    'date' => $request->input('date'),
                    'time' => $request->input('time'),
                    'requirements' => $request->input('requirements'),
                    'amount' => $amount,
                    'status' => 'pending',
                    'payment_status' => 'escrow',
                ]);

                $walletService->debit(
                    $user,
                    $amount,
                    'session',
                    'Session booking',
                    ($service->title ?: 'Mentoring session') . ' with ' . ($mentor->user?->name ?? 'mentor'),
                    'success',
                    'BOOK-' . $booking->id
                );

                if ($mentor->user) {
                    $notifications->notify(
                        $mentor->user,
                        'New booking request',
                        ($user->name ?: 'A candidate') . ' requested a session for ' . ($service->title ?: 'mentoring') . '.',
                        'booking',
                        ['booking_id' => $booking->id, 'status' => 'pending']
                    );
                }

                $notifications->notify(
                    $user,
                    'Booking requested',
                    'Your session request was submitted. Payment of ₹' . number_format($amount, 0) . ' is held in escrow.',
                    'booking',
                    ['booking_id' => $booking->id, 'status' => 'pending']
                );

                $notifications->notify(
                    $user,
                    'Payment successful',
                    '₹' . number_format($amount, 0) . ' was deducted from your wallet for booking #' . $booking->id . '.',
                    'payment',
                    ['booking_id' => $booking->id, 'amount' => $amount]
                );

                return $booking;
            });
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage() === 'Insufficient wallet balance.'
                    ? 'Insufficient wallet balance. Please add money to your wallet.'
                    : $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'booking' => new MentorBookingResource(
                $booking->load(['mentor.user', 'service', 'candidate'])
            ),
            'message' => 'Booking created and payment held in escrow.',
        ], 201);
    }

    public function showBooking(Request $request, MentorBooking $booking)
    {
        $user = $this->auth($request);
        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        if ($user->role === 'seeker' && $booking->candidate_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($user->role === 'mentor') {
            $mentor = MentorProfile::where('user_id', $user->id)->first();
            if (! $mentor || $booking->mentor_id !== $mentor->id) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        return response()->json([
            'booking' => new MentorBookingResource($booking->load(['mentor.user', 'service', 'candidate'])),
        ]);
    }

    public function cancelBooking(Request $request, MentorBooking $booking)
    {
        $user = $this->auth($request);
        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        if ($user->role === 'seeker' && $booking->candidate_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (! in_array($booking->status, ['pending', 'confirmed', 'accepted'], true)) {
            return response()->json(['message' => 'This booking cannot be cancelled.'], 422);
        }

        $booking->loadMissing(['candidate', 'mentor.user', 'service']);

        $refunded = false;

        DB::transaction(function () use ($booking, &$refunded) {
            $shouldRefund = in_array($booking->payment_status, ['escrow', 'pending'], true)
                && (float) $booking->amount > 0
                && $booking->candidate;

            $booking->update([
                'status' => 'cancelled',
                'payment_status' => $shouldRefund ? 'refunded' : $booking->payment_status,
            ]);

            if ($shouldRefund) {
                app(WalletService::class)->credit(
                    $booking->candidate,
                    (float) $booking->amount,
                    'refund',
                    'Booking refund',
                    'Refund for cancelled booking #' . $booking->id,
                    'success',
                    'REFUND-' . $booking->id
                );
                $refunded = true;
            }
        });

        $notifications = app(NotificationService::class);

        if ($booking->candidate) {
            $notifications->notify(
                $booking->candidate,
                'Booking cancelled',
                'Your booking #' . $booking->id . ' was cancelled'
                    . ($refunded ? ' and payment refunded.' : '.'),
                'booking',
                ['booking_id' => $booking->id, 'status' => 'cancelled']
            );
        }

        if ($booking->mentor?->user) {
            $notifications->notify(
                $booking->mentor->user,
                'Booking cancelled',
                ($booking->candidate?->name ?: 'A candidate') . ' cancelled the session'
                    . ($booking->service?->title ? ' for ' . $booking->service->title : '') . '.',
                'booking',
                ['booking_id' => $booking->id, 'status' => 'cancelled']
            );
        }

        return response()->json([
            'booking' => new MentorBookingResource($booking->fresh()->load(['mentor.user', 'service', 'candidate'])),
        ]);
    }

    public function reschedule(Request $request, MentorBooking $booking)
    {
        $user = $this->auth($request);
        if (! $user || $user->role !== 'seeker') {
            return response()->json(['message' => 'Only candidates can reschedule bookings.'], 403);
        }

        if ($booking->candidate_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (! in_array($booking->status, ['pending', 'confirmed', 'accepted'], true)) {
            return response()->json(['message' => 'This booking cannot be rescheduled.'], 422);
        }

        $data = $request->validate([
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required|string|max:20',
        ]);

        $booking->loadMissing(['mentor.user', 'service']);

        $needsReaccept = in_array($booking->status, ['confirmed', 'accepted'], true);

        $booking->update([
            'date' => $data['date'],
            'time' => $data['time'],
            'status' => $needsReaccept ? 'pending' : $booking->status,
            'meet_link' => $needsReaccept ? null : $booking->meet_link,
        ]);

        if ($booking->mentor?->user) {
            app(NotificationService::class)->notify(
                $booking->mentor->user,
                'Booking rescheduled',
                ($user->name ?: 'A candidate') . ' rescheduled the session to '
                    . $data['date'] . ' at ' . $data['time'] . '.',
                'booking',
                ['booking_id' => $booking->id, 'status' => $booking->status]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking rescheduled successfully.',
            'booking' => new MentorBookingResource($booking->fresh()->load(['mentor.user', 'service', 'candidate'])),
        ]);
    }

    public function availability(MentorProfile $mentor)
    {
        if ($mentor->onboarding_status !== 'approved' || ! $mentor->verified) {
            return response()->json(['message' => 'Mentor not found.'], 404);
        }

        // Stored day_of_week: 0=Monday ... 6=Sunday (matches MentorAvailabilityController)
        $map = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        $rows = MentorAvailability::where('mentor_id', $mentor->id)
            ->where('is_available', true)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        $schedule = [];
        foreach ($map as $index => $day) {
            $slots = $rows->where('day_of_week', $index)
                ->map(function ($row) {
                    try {
                        return Carbon::parse($row->start_time)->format('h:i A');
                    } catch (\Throwable) {
                        return (string) $row->start_time;
                    }
                })
                ->filter()
                ->unique()
                ->values()
                ->all();

            $schedule[$day] = [
                'enabled' => count($slots) > 0,
                'slots' => array_values($slots),
            ];
        }

        $availableDays = collect($schedule)
            ->filter(fn ($day) => ($day['enabled'] ?? false) && ! empty($day['slots']))
            ->keys()
            ->values()
            ->all();

        return response()->json([
            'schedule' => $schedule,
            'configured' => $rows->isNotEmpty(),
            'available_days' => $availableDays,
            'timezone' => 'Asia/Kolkata',
            'days' => $map,
        ]);
    }

    // ── MENTOR: Accept or Reject a booking request ──────────────────────────

    public function respondBooking(Request $request, MentorBooking $booking)
    {
        $user = $this->auth($request);
        if (! $user || $user->role !== 'mentor') {
            return response()->json(['message' => 'Only mentors can respond to bookings.'], 403);
        }

        $mentor = MentorProfile::where('user_id', $user->id)->firstOrFail();
        if ($booking->mentor_id !== $mentor->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate(['action' => 'required|in:accept,reject']);

        $booking->loadMissing('candidate');

        if ($request->input('action') === 'accept') {
            $meetLink = $booking->meet_link ?: (
                'https://meet.careerbridge.app/session/' . $booking->id . '-' . \Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(8))
            );

            $booking->update([
                'status' => 'confirmed',
                'meet_link' => $meetLink,
            ]);

            if ($booking->candidate) {
                app(NotificationService::class)->notify(
                    $booking->candidate,
                    'Booking confirmed',
                    'Your mentoring session has been confirmed.',
                    'booking',
                    ['booking_id' => $booking->id, 'status' => 'confirmed', 'meet_link' => $meetLink]
                );

                app(NotificationService::class)->notify(
                    $booking->candidate,
                    'Session reminder',
                    'Your mentoring session is scheduled for ' . $booking->date . ' at ' . $booking->time
                        . '. Join from My Bookings when it is time.',
                    'booking',
                    ['booking_id' => $booking->id, 'type' => 'reminder', 'meet_link' => $meetLink]
                );
            }
        } else {
            DB::transaction(function () use ($booking) {
                $shouldRefund = in_array($booking->payment_status, ['escrow', 'pending'], true)
                    && (float) $booking->amount > 0
                    && $booking->candidate;

                $booking->update([
                    'status' => 'rejected',
                    'payment_status' => $shouldRefund ? 'refunded' : $booking->payment_status,
                ]);

                if ($shouldRefund) {
                    app(WalletService::class)->credit(
                        $booking->candidate,
                        (float) $booking->amount,
                        'refund',
                        'Booking refund',
                        'Refund for rejected booking #' . $booking->id,
                        'success',
                        'REFUND-' . $booking->id
                    );
                }
            });

            if ($booking->candidate) {
                app(NotificationService::class)->notify(
                    $booking->candidate,
                    'Booking rejected',
                    'Your mentoring session request was declined. Payment has been refunded.',
                    'booking',
                    ['booking_id' => $booking->id, 'status' => 'rejected']
                );
            }
        }

        return response()->json([
            'booking' => new MentorBookingResource($booking->fresh()->load(['mentor.user', 'service', 'candidate'])),
        ]);
    }

    // ── MENTOR: Mark session as complete ────────────────────────────────────

    public function completeSession(Request $request, MentorBooking $booking)
    {
        // Canonical completion path (wallet credit + review stub + notifications)
        return app(\App\Http\Controllers\Api\MentorUpcomingSessionController::class)
            ->complete($request, $booking->id);
    }

    // ── MENTOR: Manage own services ─────────────────────────────────────────

    public function mentorServices(Request $request)
    {
        $user   = $this->auth($request);
        $mentor = MentorProfile::where('user_id', $user?->id)->firstOrFail();
        $mentor->load('services');

        return response()->json([
            'services' => MentorServiceResource::collection($mentor->services),
        ]);
    }

    public function storeMentorService(Request $request)
    {
        $user   = $this->auth($request);
        $mentor = MentorProfile::where('user_id', $user?->id)->firstOrFail();

        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string',
            'price'        => 'required|numeric|min:0',
            'duration'     => 'required|integer|min:1',
            'session_type' => 'required|string|max:50',
            'status'       => 'nullable|in:active,inactive',
        ]);

        $service = $mentor->services()->create([
            ...$data,
            'status' => $data['status'] ?? 'active',
        ]);

        return response()->json([
            'service' => new MentorServiceResource($service),
        ], 201);
    }

    public function updateMentorService(Request $request, MentorService $service)
    {
        $user   = $this->auth($request);
        $mentor = MentorProfile::where('user_id', $user?->id)->firstOrFail();

        if ($service->mentor_id !== $mentor->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'title'        => 'sometimes|string|max:255',
            'description'  => 'nullable|string',
            'price'        => 'sometimes|numeric|min:0',
            'duration'     => 'sometimes|integer|min:1',
            'session_type' => 'sometimes|string|max:50',
            'status'       => 'sometimes|in:active,inactive',
        ]);

        $service->update($data);

        return response()->json([
            'service' => new MentorServiceResource($service->fresh()),
        ]);
    }

    public function destroyMentorService(Request $request, MentorService $service)
    {
        $user   = $this->auth($request);
        $mentor = MentorProfile::where('user_id', $user?->id)->firstOrFail();

        if ($service->mentor_id !== $mentor->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $service->delete();

        return response()->json(['message' => 'Service deleted.']);
    }

    // ── MENTOR: Availability ─────────────────────────────────────────────────

    public function getAvailability(Request $request)
    {
        $user   = $this->auth($request);
        $mentor = MentorProfile::where('user_id', $user?->id)->firstOrFail();

        return response()->json([
            'availability' => $mentor->availability ?? [],
        ]);
    }

    public function updateAvailability(Request $request)
    {
        $user   = $this->auth($request);
        $mentor = MentorProfile::where('user_id', $user?->id)->firstOrFail();

        $data = $request->validate([
            'availability'         => 'required|array',
            'availability.*.day'   => 'required|string',
            'availability.*.slots' => 'required|array',
        ]);

        $mentor->update(['availability' => $data['availability']]);

        return response()->json([
            'availability' => $mentor->fresh()->availability,
        ]);
    }

    // ── MENTOR: Reviews ──────────────────────────────────────────────────────

    public function mentorReviews(Request $request)
    {
        $user   = $this->auth($request);
        $mentor = MentorProfile::where('user_id', $user?->id)->firstOrFail();
        $mentor->load(['reviews' => fn ($q) => $q->latest()]);

        return response()->json([
            'reviews' => MentorReviewResource::collection($mentor->reviews),
        ]);
    }

    // ── CANDIDATE: Submit a review ───────────────────────────────────────────

    public function submitReview(Request $request, MentorBooking $booking)
    {
        $user = $this->auth($request);
        if (! $user || $user->role !== 'seeker') {
            return response()->json(['message' => 'Only candidates can submit reviews.'], 403);
        }

        if ($booking->candidate_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($booking->status !== 'completed') {
            return response()->json(['message' => 'Session must be completed before reviewing.'], 422);
        }

        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review = MentorReview::updateOrCreate(
            [
                'booking_id' => $booking->id,
                'user_id' => $user->id,
            ],
            [
                'mentor_id' => $booking->mentor_id,
                'rating' => $data['rating'],
                'comment' => $data['comment'] ?? '',
                'status' => 'submitted',
                'submitted_at' => now(),
            ]
        );

        $mentor = MentorProfile::find($booking->mentor_id);
        if ($mentor) {
            $submitted = MentorReview::where('mentor_id', $mentor->id)
                ->where('status', 'submitted');

            $mentor->update([
                'rating' => round((float) $submitted->avg('rating'), 1),
                'review_count' => (int) $submitted->count(),
            ]);
        }

        if ($mentor?->user) {
            app(NotificationService::class)->notify(
                $mentor->user,
                'New review received',
                ($user->name ?: 'A candidate') . ' left a ' . $data['rating'] . '★ review.',
                'review',
                ['booking_id' => $booking->id, 'review_id' => $review->id]
            );
        }

        return response()->json([
            'review' => new MentorReviewResource($review->load(['mentor.user', 'user', 'booking.service'])),
            'message' => 'Review submitted successfully.',
        ], 201);
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    protected function auth(Request $request): ?User
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        if ($token && $user = User::where('api_token', $token)->first()) {
            return $user;
        }

        return $request->user('sanctum');
    }
}