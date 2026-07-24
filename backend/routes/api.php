<?php

use App\Http\Controllers\Api\MentorController;
use App\Models\AuthOtp;
use App\Models\MentorSession;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\OpportunityController;
use App\Http\Controllers\Api\SavedOpportunityController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\ResumeController;
use App\Http\Controllers\Api\MentorReviewController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MentorIncomingRequestController;
use App\Http\Controllers\Api\MentorUpcomingSessionController;
use App\Http\Controllers\Api\MentorSessionHistoryController;
use App\Http\Controllers\Api\MentorProfileSetupController;
use App\Http\Controllers\Api\MentorProfileController;
use App\Http\Controllers\Api\MentorServiceController;
use App\Http\Controllers\Api\MentorEarningsController;
use App\Http\Controllers\Api\MentorWithdrawController;
use App\Http\Controllers\Api\MentorReviewsController;
use App\Http\Controllers\Api\MentorNotificationController;
use App\Http\Controllers\Api\MentorProfileSettingsController;
use App\Http\Controllers\Api\Mentor\MentorSecurityController;
use App\Http\Controllers\Api\Mentor\MentorDashboardController;


Route::post(
    '/mentor/change-password',
    [MentorSecurityController::class, 'changePassword']
);


Route::get(
    '/mentor/dashboard',
    [MentorDashboardController::class, 'index']
);


    Route::get('/mentor/profile-settings', [MentorProfileSettingsController::class, 'show']);

    Route::put('/mentor/profile-settings', [MentorProfileSettingsController::class, 'update']);


Route::get('/mentor/notifications', [MentorNotificationController::class, 'index']);

Route::middleware('auth:sanctum')->get(
    '/mentor/reviews',
    [MentorReviewsController::class, 'index']
);

Route::post('/mentor/withdraw', [MentorWithdrawController::class, 'store']);

Route::get('/mentor/withdraw', [MentorWithdrawController::class, 'index']);

Route::get('/mentor/earnings', [MentorEarningsController::class, 'index']);

Route::get('mentor/services', [
    MentorServiceController::class,
    'index'
]);

Route::post('mentor/services', [
    MentorServiceController::class,
    'store'
]);

Route::put('mentor/services/{id}', [
    MentorServiceController::class,
    'update'
]);

Route::patch('mentor/services/{id}/toggle', [
    MentorServiceController::class,
    'toggle'
]);

Route::delete('mentor/services/{id}', [
    MentorServiceController::class,
    'destroy'
]);

Route::get('/mentor/profile', [MentorProfileController::class, 'show']);

Route::post('/mentor/profile/setup', [MentorProfileSetupController::class, 'store']);

Route::post(
    'mentor/upcoming-sessions/{id}/complete',
    [MentorUpcomingSessionController::class, 'complete']
);

Route::get(
    '/mentor/session-history',
    [MentorSessionHistoryController::class, 'index']
);

Route::get('/mentor/incoming-requests', [
    MentorIncomingRequestController::class,
    'index'
]);

Route::post('/mentor/incoming-requests/{booking}/accept', [
    MentorIncomingRequestController::class,
    'accept'
]);

Route::post('/mentor/incoming-requests/{booking}/reject', [
    MentorIncomingRequestController::class,
    'reject'
]);

Route::get(
    '/mentor/upcoming-sessions',
    [MentorUpcomingSessionController::class, 'index']
);

Route::get('/dashboard', [DashboardController::class, 'index']);

Route::get('/profile', [ProfileController::class, 'show']);

Route::post('/profile/update', [ProfileController::class, 'update']);

Route::get('/reviews', [MentorReviewController::class, 'index']);

Route::post('/reviews', [MentorReviewController::class, 'store']);

Route::post('/upload-resume', [ResumeController::class, 'upload']);

Route::post('/opportunities/apply', [ApplicationController::class, 'apply']);

Route::get('/opportunities/applications', [ApplicationController::class, 'index']);

Route::get('/wallet', [WalletController::class, 'index']);
Route::get('/wallet/transactions', [WalletController::class, 'transactions']);



Route::get('/opportunities/saved', [SavedOpportunityController::class, 'index']);

Route::post('/opportunities/save', [SavedOpportunityController::class, 'store']);

Route::delete('/opportunities/save/{opportunity}', [SavedOpportunityController::class, 'destroy']);

Route::get('/opportunities', [OpportunityController::class, 'index']);
Route::get('/opportunities/{opportunity}', [OpportunityController::class, 'show']);

$userFields = ['id', 'name', 'email', 'mobile', 'role', 'company', 'current_role', 'target_roles', 'location', 'bio'];

$resolveAuthenticatedUser = function (Request $request): ?User {
    $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');
    return $token ? User::where('api_token', $token)->first() : null;
};

$issueOtp = function (string $email, string $purpose): array {
    $code = (string) random_int(100000, 999999);
    AuthOtp::where('email', $email)->where('purpose', $purpose)->delete();
    AuthOtp::create([
        'email'      => $email,
        'purpose'    => $purpose,
        'code'       => Hash::make($code),
        'expires_at' => now()->addMinutes(10),
    ]);
    Log::info("CareerBridge {$purpose} OTP for {$email}: {$code}");
    return app()->environment('local') ? ['dev_otp' => $code] : [];
};

$verifyOtp = function (string $email, string $purpose, string $code): bool {
    $otp = AuthOtp::where('email', $email)->where('purpose', $purpose)->latest()->first();
    if (! $otp || $otp->expires_at->isPast() || ! Hash::check($code, $otp->code)) return false;
    $otp->delete();
    return true;
};

// ── AUTH ──────────────────────────────────────────────────────────────────────

Route::post('auth/register', function (Request $request) use ($issueOtp) {
    $data = $request->validate([
        'name'     => 'required|string|max:255',
        'email'    => 'required|email|max:255|unique:users,email',
        'mobile'   => 'required|string|min:8|max:30|unique:users,mobile',
        'password' => 'required|string|min:8',
    ]);
    User::create([...$data, 'role' => 'seeker']);
    return response()->json(['message' => 'OTP sent.'] + $issueOtp($data['email'], 'registration'), 201);
});

Route::post('auth/verify-registration', function (Request $request) use ($verifyOtp, $userFields) {
    $data = $request->validate(['email' => 'required|email', 'otp' => 'required|string|size:6']);
    if (! $verifyOtp($data['email'], 'registration', $data['otp'])) {
        throw ValidationException::withMessages(['otp' => ['The OTP is invalid or expired.']]);
    }
    $user = User::where('email', $data['email'])->firstOrFail();
    $user->forceFill(['email_verified_at' => now(), 'api_token' => Str::random(60)])->save();
    return response()->json(['user' => $user->only($userFields), 'api_token' => $user->api_token]);
});

Route::post('auth/select-role', function (Request $request) use ($resolveAuthenticatedUser, $userFields) {
    $user = $resolveAuthenticatedUser($request);
    if (! $user) return response()->json(['message' => 'Unauthorized.'], 401);
    $data = $request->validate(['role' => 'required|in:seeker,mentor,opportunity_provider,admin']);
    $user->update($data);
    return response()->json(['user' => $user->only($userFields)]);
});

Route::post('auth/login', function (Request $request) use ($userFields) {
    $data = $request->validate(['login' => 'required|string', 'password' => 'required|string|min:8']);
    $user = User::where('email', $data['login'])->orWhere('mobile', $data['login'])->first();
    if (! $user || ! Hash::check($data['password'], $user->password)) {
        throw ValidationException::withMessages(['login' => ['The provided credentials are incorrect.']]);
    }
    $user->forceFill(['api_token' => Str::random(60)])->save();
   $mentorProfile = null;

if ($user->role === 'mentor') {
    $mentorProfile = $user->mentorProfile;
}

return response()->json([
    'user' => $user->only($userFields),
    'api_token' => $user->api_token,

    'mentor_onboarding' => $user->role === 'mentor'
        ? [
            'has_profile' => (bool) $mentorProfile,
            'status' => $mentorProfile?->onboarding_status ?? 'profile_setup',
            'verified' => $mentorProfile?->verified ?? false,
        ]
        : null,
]);
});

Route::post('auth/forgot-password', function (Request $request) use ($issueOtp) {
    $data = $request->validate(['email' => 'required|email']);
    if (! User::where('email', $data['email'])->exists()) {
        throw ValidationException::withMessages(['email' => ['No account exists for this email address.']]);
    }
    return response()->json(['message' => 'OTP sent.'] + $issueOtp($data['email'], 'password_reset'));
});

Route::post('auth/reset-password', function (Request $request) use ($verifyOtp) {
    $data = $request->validate([
        'email'                 => 'required|email',
        'otp'                   => 'required|string|size:6',
        'password'              => 'required|string|min:8|confirmed',
    ]);
    if (! $verifyOtp($data['email'], 'password_reset', $data['otp'])) {
        throw ValidationException::withMessages(['otp' => ['The OTP is invalid or expired.']]);
    }
    User::where('email', $data['email'])->firstOrFail()
        ->forceFill(['password' => $data['password'], 'api_token' => null])
        ->save();
    return response()->json(['message' => 'Password updated. Please log in again.']);
});

Route::post('auth/logout', function (Request $request) use ($resolveAuthenticatedUser) {
    if ($user = $resolveAuthenticatedUser($request)) {
        $user->forceFill(['api_token' => null])->save();
    }
    return response()->json(['message' => 'Logged out successfully.']);
});


Route::get('auth/user', function (Request $request) use ($resolveAuthenticatedUser, $userFields) {
    $user = $resolveAuthenticatedUser($request);

    if (!$user) {
        return response()->json([
            'message' => 'Unauthorized.'
        ], 401);
    }

    $mentorProfile = null;

    if ($user->role === 'mentor') {
        $mentorProfile = $user->mentorProfile;
    }

    return response()->json([
        'user' => $user->only($userFields),

        'mentor_onboarding' => $user->role === 'mentor'
            ? [
                'has_profile' => (bool) $mentorProfile,
                'status' => $mentorProfile?->onboarding_status ?? 'profile_setup',
                'verified' => $mentorProfile?->verified ?? false,
            ]
            : null,
    ]);
});


Route::put('auth/profile', function (Request $request) use ($resolveAuthenticatedUser, $userFields) {
    $user = $resolveAuthenticatedUser($request);
    if (! $user) return response()->json(['message' => 'Unauthorized.'], 401);
    $data = $request->validate([
        'name'         => 'required|string|max:255',
        'email'        => 'required|email|max:255|unique:users,email,' . $user->id,
        'role'         => 'required|in:seeker,mentor,opportunity_provider,admin',
        'company'      => 'nullable|string|max:255',
        'current_role' => 'nullable|string|max:255',
        'target_roles' => 'nullable|string',
        'location'     => 'nullable|string|max:255',
        'bio'          => 'nullable|string',
    ]);
    $user->fill($data)->save();
    return response()->json(['user' => $user->only($userFields)]);
});

// ── LEGACY SESSIONS (kept for backward compat) ────────────────────────────────

Route::get('sessions', function (Request $request) use ($resolveAuthenticatedUser) {
    $user = $resolveAuthenticatedUser($request);
    if (! $user) return response()->json(['message' => 'Unauthorized.'], 401);
    return response()->json([
        'sessions' => MentorSession::where('user_id', $user->id)
            ->orderBy('scheduled_at')
            ->get(['id', 'mentor_name', 'topic', 'scheduled_at', 'status']),
    ]);
});

Route::post('sessions', function (Request $request) use ($resolveAuthenticatedUser) {
    $user = $resolveAuthenticatedUser($request);
    if (! $user) return response()->json(['message' => 'Unauthorized.'], 401);
    $data = $request->validate([
        'mentor_name'  => 'required|string|max:255',
        'topic'        => 'required|string|max:255',
        'scheduled_at' => 'required|date|after:now',
    ]);
    $session = MentorSession::create([...$data, 'user_id' => $user->id, 'status' => 'scheduled']);
    return response()->json([
        'session' => $session->only(['id', 'mentor_name', 'topic', 'scheduled_at', 'status']),
    ], 201);
});

// ── MENTORS: PUBLIC ───────────────────────────────────────────────────────────

Route::get('mentors',                         [MentorController::class, 'index']);
Route::get('mentors/{mentor}',                [MentorController::class, 'show']);
Route::get('mentors/{mentor}/services',       [MentorController::class, 'services']);
Route::get('mentors/{mentor}/reviews',        [MentorController::class, 'reviews']);

// ── MENTORS: CANDIDATE ACTIONS ────────────────────────────────────────────────

Route::post('mentors/save',                   [MentorController::class, 'save']);
Route::delete('mentors/save/{mentor}',        [MentorController::class, 'destroySave']);
Route::get('mentors/saved',                   [MentorController::class, 'saved']);

// ── BOOKINGS: CANDIDATE ───────────────────────────────────────────────────────

Route::post('bookings',                       [MentorController::class, 'storeBooking']);
Route::get('bookings',                        [MentorController::class, 'bookings']);
Route::get('bookings/{booking}',              [MentorController::class, 'showBooking']);
Route::patch('bookings/{booking}/cancel',     [MentorController::class, 'cancelBooking']);
Route::post('bookings/{booking}/review',      [MentorController::class, 'submitReview']);

// ── MENTOR PANEL ──────────────────────────────────────────────────────────────

Route::prefix('mentor')->group(function () {

    // Bookings
    Route::get('bookings',                              [MentorController::class, 'bookings']);
    Route::post('bookings/{booking}/respond',           [MentorController::class, 'respondBooking']);
    Route::post('bookings/{booking}/complete',          [MentorController::class, 'completeSession']);

    // Services CRUD
    Route::get('services',                              [MentorController::class, 'mentorServices']);
    Route::post('services',                             [MentorController::class, 'storeMentorService']);
    Route::put('services/{service}',                    [MentorController::class, 'updateMentorService']);
    Route::delete('services/{service}',                 [MentorController::class, 'destroyMentorService']);

    // Availability
    Route::get('availability',                          [MentorController::class, 'getAvailability']);
    Route::post('availability',                         [MentorController::class, 'updateAvailability']);

    // Reviews
    Route::get('reviews',                               [MentorController::class, 'mentorReviews']);
});
