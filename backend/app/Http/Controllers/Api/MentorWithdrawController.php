<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\WithdrawRequestResource;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WithdrawRequest;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class MentorWithdrawController extends Controller
{
    public const MIN_WITHDRAW = 500;

    public function __construct(private NotificationService $notifications)
    {
    }

    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken()
            ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $wallet = Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        $pendingWithdraw = (float) WithdrawRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');

        $totalWithdrawn = (float) WithdrawRequest::where('user_id', $user->id)
            ->where('status', 'approved')
            ->sum('amount');

        $history = WithdrawRequest::where('user_id', $user->id)
            ->latest()
            ->get();

        $bank = $user->mentorProfile?->bankDetail;

        return response()->json([
            'summary' => [
                'available_balance' => max((float) $wallet->balance - $pendingWithdraw, 0),
                'wallet_balance' => (float) $wallet->balance,
                'pending_withdraw' => $pendingWithdraw,
                'total_withdrawn' => $totalWithdrawn,
                'minimum_withdraw' => self::MIN_WITHDRAW,
            ],
            'bank' => $bank ? [
                'account_holder' => $bank->account_holder,
                'bank_name' => $bank->bank_name,
                'account_number' => $bank->account_number,
                'ifsc_code' => $bank->ifsc_code,
                'upi_id' => $bank->upi_id,
            ] : null,
            'history' => WithdrawRequestResource::collection($history),
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->authUser($request);

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $bank = $user->mentorProfile?->bankDetail;

        $validated = $request->validate([
            'amount' => 'required|numeric|min:' . self::MIN_WITHDRAW,
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'account_holder' => 'nullable|string|max:255',
            'ifsc' => 'nullable|string|max:20',
            'upi' => 'nullable|string|max:255',
            'remarks' => 'nullable|string|max:2000',
        ]);

        $bankName = $validated['bank_name'] ?? $bank?->bank_name;
        $accountNumber = $validated['account_number'] ?? $bank?->account_number;
        $accountHolder = $validated['account_holder'] ?? $bank?->account_holder;
        $ifsc = $validated['ifsc'] ?? $bank?->ifsc_code;
        $upi = $validated['upi'] ?? $bank?->upi_id;

        if (! $bankName || ! $accountNumber) {
            return response()->json([
                'message' => 'Please add bank details in Profile Settings before withdrawing.',
            ], 422);
        }

        if (! $ifsc && ! $upi) {
            return response()->json([
                'message' => 'Provide IFSC or UPI for payout.',
            ], 422);
        }

        $wallet = Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        $pendingWithdraw = (float) WithdrawRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');

        $available = max((float) $wallet->balance - $pendingWithdraw, 0);
        $amount = (float) $validated['amount'];

        if ($amount > $available) {
            return response()->json([
                'message' => 'Insufficient available wallet balance.',
                'available_balance' => $available,
            ], 422);
        }

        $payload = [
            'user_id' => $user->id,
            'amount' => $amount,
            'bank_name' => $bankName,
            'account_number' => $accountNumber,
            'remarks' => $validated['remarks'] ?? null,
            'status' => 'pending',
        ];

        if (Schema::hasColumn('withdraw_requests', 'account_holder')) {
            $payload['account_holder'] = $accountHolder;
        }
        if (Schema::hasColumn('withdraw_requests', 'ifsc')) {
            $payload['ifsc'] = $ifsc;
        }
        if (Schema::hasColumn('withdraw_requests', 'upi')) {
            $payload['upi'] = $upi;
        }

        $withdraw = WithdrawRequest::create($payload);

        $this->notifications->notify(
            $user,
            'Withdrawal request submitted',
            'Your withdrawal request of ₹' . number_format($amount, 2) . ' is pending review.',
            'withdraw',
            ['withdraw_request_id' => $withdraw->id, 'status' => 'pending']
        );

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal request submitted successfully.',
            'withdraw' => new WithdrawRequestResource($withdraw),
        ], 201);
    }

    public function cancel(Request $request, int $id)
    {
        $user = $this->authUser($request);

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $withdraw = WithdrawRequest::where('user_id', $user->id)->find($id);

        if (! $withdraw) {
            return response()->json([
                'message' => 'Withdrawal request not found.',
            ], 404);
        }

        if ($withdraw->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending withdrawal requests can be cancelled.',
            ], 422);
        }

        $withdraw->status = 'cancelled';
        if (Schema::hasColumn('withdraw_requests', 'processed_at')) {
            $withdraw->processed_at = now();
        }
        if (Schema::hasColumn('withdraw_requests', 'admin_remarks')) {
            $withdraw->admin_remarks = trim(($withdraw->admin_remarks ? $withdraw->admin_remarks . "\n" : '') . 'Cancelled by mentor.');
        }
        $withdraw->save();

        $this->notifications->notify(
            $user,
            'Withdrawal request cancelled',
            'Your withdrawal request of ₹' . number_format((float) $withdraw->amount, 2) . ' was cancelled.',
            'withdraw',
            ['withdraw_request_id' => $withdraw->id, 'status' => 'cancelled']
        );

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal request cancelled successfully.',
            'withdraw' => new WithdrawRequestResource($withdraw),
        ]);
    }
}
