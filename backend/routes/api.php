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
use App\Http\Controllers\Api\HR\HRDashboardController;
use App\Http\Controllers\Api\HR\HRJobController;
use App\Http\Controllers\Api\HR\HRApplicationController;
use App\Http\Controllers\Api\HR\HRCandidateController;
use App\Http\Controllers\Api\HR\HRInterviewController;
use App\Http\Controllers\Api\HR\HRPipelineController;
use App\Http\Controllers\Api\HR\HRReportController;
use App\Http\Controllers\Api\HR\HRProfileController;
use App\Http\Controllers\Api\HR\HRNotificationController;
use App\Http\Controllers\Api\HR\HRSettingsController;
use App\Http\Controllers\Api\Recruiter\RecruiterApplicationController;
use App\Http\Controllers\Api\Recruiter\RecruiterDashboardController;
use App\Http\Controllers\Api\Recruiter\RecruiterNotificationController;
use App\Http\Controllers\Api\Recruiter\RecruiterOpportunityController;
use App\Http\Controllers\Api\Recruiter\RecruiterSettingsController;
use App\Http\Controllers\Api\Recruiter\RecruiterUnlockController;
use App\Http\Controllers\Api\Recruiter\RecruiterWalletController;
use App\Http\Controllers\Api\Recruiter\RecruiterWithdrawController;


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
    $data = $request->validate(['role' => 'required|in:seeker,mentor,opportunity_provider,hr,admin']);
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
        'role'         => 'required|in:seeker,mentor,opportunity_provider,hr,admin',
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

// ── HR MODULE ─────────────────────────────────────────────────────────────────

Route::prefix('hr')->group(function () {
    Route::get('dashboard', [HRDashboardController::class, 'index']);

    Route::get('jobs', [HRJobController::class, 'index']);
    Route::post('jobs', [HRJobController::class, 'store']);
    Route::post('jobs/bulk', [HRJobController::class, 'bulk']);
    Route::get('jobs/{id}', [HRJobController::class, 'show']);
    Route::put('jobs/{id}', [HRJobController::class, 'update']);
    Route::post('jobs/{id}/close', [HRJobController::class, 'close']);
    Route::post('jobs/{id}/reopen', [HRJobController::class, 'reopen']);
    Route::post('jobs/{id}/archive', [HRJobController::class, 'archive']);
    Route::post('jobs/{id}/publish', [HRJobController::class, 'publish']);
    Route::post('jobs/{id}/draft', [HRJobController::class, 'draft']);
    Route::post('jobs/{id}/duplicate', [HRJobController::class, 'duplicate']);
    Route::delete('jobs/{id}', [HRJobController::class, 'destroy']);

    Route::get('applications', [HRApplicationController::class, 'index']);
    Route::post('applications', [HRApplicationController::class, 'store']);
    Route::post('applications/bulk', [HRApplicationController::class, 'bulkUpdate']);
    Route::post('applications/{id}/shortlist', [HRApplicationController::class, 'shortlist']);
    Route::post('applications/{id}/reject', [HRApplicationController::class, 'reject']);
    Route::get('applications/{id}', [HRApplicationController::class, 'show']);
    Route::put('applications/{id}', [HRApplicationController::class, 'update']);
    Route::delete('applications/{id}', [HRApplicationController::class, 'destroy']);

    Route::get('candidates', [HRCandidateController::class, 'index']);
    Route::get('candidates/{id}', [HRCandidateController::class, 'show']);
    Route::post('candidates/{id}/tags', [HRCandidateController::class, 'updateTags']);
    Route::post('candidates/{id}/notes', [HRCandidateController::class, 'storeNote']);
    Route::delete('candidates/{id}/notes/{noteId}', [HRCandidateController::class, 'destroyNote']);

    Route::get('interviews', [HRInterviewController::class, 'index']);
    Route::post('interviews', [HRInterviewController::class, 'store']);
    Route::get('interviews/calendar', [HRInterviewController::class, 'calendar']);
    Route::get('interviews/{id}', [HRInterviewController::class, 'show']);
    Route::put('interviews/{id}', [HRInterviewController::class, 'update']);
    Route::post('interviews/{id}/complete', [HRInterviewController::class, 'complete']);
    Route::post('interviews/{id}/cancel', [HRInterviewController::class, 'cancel']);
    Route::post('interviews/{id}/reschedule', [HRInterviewController::class, 'reschedule']);
    Route::delete('interviews/{id}', [HRInterviewController::class, 'destroy']);

    Route::get('pipeline', [HRPipelineController::class, 'index']);
    Route::post('pipeline/{id}/move', [HRPipelineController::class, 'move']);

    Route::get('reports', [HRReportController::class, 'index']);

    Route::get('profile', [HRProfileController::class, 'show']);
    Route::post('profile', [HRProfileController::class, 'update']);

    Route::get('notifications', [HRNotificationController::class, 'index']);
    Route::get('notifications/unread-count', [HRNotificationController::class, 'unreadCount']);
    Route::post('notifications/{id}/read', [HRNotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [HRNotificationController::class, 'markAllRead']);
    Route::delete('notifications/{id}', [HRNotificationController::class, 'destroy']);

    Route::get('settings', [HRSettingsController::class, 'show']);
    Route::put('settings/profile', [HRSettingsController::class, 'updateProfile']);
    Route::post('settings/password', [HRSettingsController::class, 'changePassword']);
    Route::put('settings/preferences', [HRSettingsController::class, 'updatePreferences']);
    Route::post('settings/avatar', [HRSettingsController::class, 'updateAvatar']);
});

// ── RECRUITER MODULE ──────────────────────────────────────────────────────────

Route::prefix('recruiter')->group(function () {
    Route::get('dashboard', [RecruiterDashboardController::class, 'index']);

    Route::get('opportunities', [RecruiterOpportunityController::class, 'index']);
    Route::post('opportunities', [RecruiterOpportunityController::class, 'store']);
    Route::post('opportunities/save-draft', [RecruiterOpportunityController::class, 'saveDraft']);
    Route::post('opportunities/bulk', [RecruiterOpportunityController::class, 'bulk']);
    Route::get('opportunities/{id}', [RecruiterOpportunityController::class, 'show']);
    Route::put('opportunities/{id}', [RecruiterOpportunityController::class, 'update']);
    Route::delete('opportunities/{id}', [RecruiterOpportunityController::class, 'destroy']);
    Route::post('opportunities/{id}/close', [RecruiterOpportunityController::class, 'close']);
    Route::post('opportunities/{id}/publish', [RecruiterOpportunityController::class, 'publish']);
    Route::post('opportunities/{id}/draft', [RecruiterOpportunityController::class, 'draft']);
    Route::post('opportunities/{id}/archive', [RecruiterOpportunityController::class, 'archive']);
    Route::post('opportunities/{id}/pause', [RecruiterOpportunityController::class, 'pause']);
    Route::post('opportunities/{id}/reopen', [RecruiterOpportunityController::class, 'reopen']);
    Route::post('opportunities/{id}/duplicate', [RecruiterOpportunityController::class, 'duplicate']);

    Route::get('applications', [RecruiterApplicationController::class, 'index']);
    Route::post('applications', [RecruiterApplicationController::class, 'store']);
    Route::post('applications/bulk', [RecruiterApplicationController::class, 'bulkUpdate']);
    Route::post('applications/{id}/shortlist', [RecruiterApplicationController::class, 'shortlist']);
    Route::post('applications/{id}/reject', [RecruiterApplicationController::class, 'reject']);
    Route::post('applications/{id}/schedule-interview', [RecruiterApplicationController::class, 'scheduleInterview']);
    Route::get('applications/{id}', [RecruiterApplicationController::class, 'show']);
    Route::put('applications/{id}', [RecruiterApplicationController::class, 'update']);

    Route::get('notifications', [RecruiterNotificationController::class, 'index']);
    Route::get('notifications/unread-count', [RecruiterNotificationController::class, 'unreadCount']);
    Route::post('notifications/{id}/read', [RecruiterNotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [RecruiterNotificationController::class, 'markAllRead']);
    Route::delete('notifications/{id}', [RecruiterNotificationController::class, 'destroy']);

    Route::get('wallet', [RecruiterWalletController::class, 'index']);
    Route::get('wallet/transactions', [RecruiterWalletController::class, 'transactions']);

    Route::get('unlocks', [RecruiterUnlockController::class, 'index']);
    Route::get('unlocks/stats', [RecruiterUnlockController::class, 'stats']);
    Route::get('unlocks/chart', [RecruiterUnlockController::class, 'chart']);

    Route::get('withdraw', [RecruiterWithdrawController::class, 'index']);
    Route::post('withdraw', [RecruiterWithdrawController::class, 'store']);

    Route::get('settings', [RecruiterSettingsController::class, 'show']);
    Route::put('settings/profile', [RecruiterSettingsController::class, 'updateProfile']);
    Route::post('settings/password', [RecruiterSettingsController::class, 'changePassword']);
    Route::put('settings/preferences', [RecruiterSettingsController::class, 'updatePreferences']);
});
