<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveMentorRequest;
use App\Http\Requests\StoreMentorBookingRequest;
use App\Http\Resources\MentorBookingResource;
use App\Http\Resources\MentorResource;
use App\Http\Resources\MentorReviewResource;
use App\Http\Resources\MentorServiceResource;
use App\Models\MentorBooking;
use App\Models\MentorProfile;
use App\Models\MentorReview;
use App\Models\MentorService;
use App\Models\SavedMentor;
use App\Models\User;
use Illuminate\Http\Request;

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
            ]);

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
            $query->where('is_verified', true);
        }

        $sort = $request->query('sort', 'rating');
        match ($sort) {
            'sessions'   => $query->orderByDesc('total_sessions'),
            'price_asc'  => $query->orderBy('min_price'),
            'price_desc' => $query->orderByDesc('min_price'),
            default      => $query->orderByDesc('rating'),
        };

        return response()->json([
            'mentors' => MentorResource::collection($query->get()),
        ]);
    }

    // ── PUBLIC: Single mentor ────────────────────────────────────────────────

    public function show(MentorProfile $mentor)
    {
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

        $mentor  = MentorProfile::findOrFail($request->input('mentor_id'));
        $service = MentorService::findOrFail($request->input('service_id'));

        $booking = MentorBooking::create([
            'mentor_id'      => $mentor->id,
            'candidate_id'   => $user->id,
            'service_id'     => $service->id,
            'date'           => $request->input('date'),
            'time'           => $request->input('time'),
            'requirements'   => $request->input('requirements'),
            'amount'         => $request->input('amount', $service->price),
            'status'         => 'pending',
            'payment_status' => 'escrow',
        ]);

        return response()->json([
            'booking' => new MentorBookingResource(
                $booking->load(['mentor.user', 'service', 'candidate'])
            ),
        ], 201);
    }

    public function showBooking(Request $request, MentorBooking $booking)
    {
        $user = $this->auth($request);
        if (! $user) return response()->json(['message' => 'Unauthorized.'], 401);

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
        if (! $user) return response()->json(['message' => 'Unauthorized.'], 401);

        if ($user->role === 'seeker' && $booking->candidate_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $booking->update(['status' => 'cancelled', 'payment_status' => 'refunded']);

        return response()->json([
            'booking' => new MentorBookingResource($booking->fresh()),
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

        if ($request->input('action') === 'accept') {
            $booking->update(['status' => 'accepted']);
        } else {
            $booking->update(['status' => 'rejected', 'payment_status' => 'refunded']);
        }

        return response()->json([
            'booking' => new MentorBookingResource($booking->fresh()),
        ]);
    }

    // ── MENTOR: Mark session as complete ────────────────────────────────────

    public function completeSession(Request $request, MentorBooking $booking)
    {
        $user = $this->auth($request);
        if (! $user || $user->role !== 'mentor') {
            return response()->json(['message' => 'Only mentors can mark sessions complete.'], 403);
        }

        $mentor = MentorProfile::where('user_id', $user->id)->firstOrFail();
        if ($booking->mentor_id !== $mentor->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (! in_array($booking->status, ['accepted', 'upcoming'])) {
            return response()->json(['message' => 'Booking is not in a completable state.'], 422);
        }

        $booking->update([
            'status'         => 'completed',
            'payment_status' => 'released',
            'completed_at'   => now(),
        ]);

        // Release earnings to mentor wallet
        $mentor->increment('wallet_balance', $booking->amount * 0.70);
        $mentor->increment('total_earnings', $booking->amount * 0.70);
        $mentor->increment('total_sessions');

        return response()->json([
            'booking'          => new MentorBookingResource($booking->fresh()),
            'earnings_released' => $booking->amount * 0.70,
        ]);
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
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review = MentorReview::updateOrCreate(
            ['booking_id' => $booking->id, 'candidate_id' => $user->id],
            ['mentor_id' => $booking->mentor_id, 'rating' => $data['rating'], 'comment' => $data['comment'] ?? '']
        );

        // Recalculate mentor average rating
        $mentor     = MentorProfile::find($booking->mentor_id);
        $avgRating  = MentorReview::where('mentor_id', $mentor->id)->avg('rating');
        $mentor->update(['rating' => round($avgRating, 1)]);

        $booking->update(['is_reviewed' => true]);

        return response()->json([
            'review' => new MentorReviewResource($review),
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