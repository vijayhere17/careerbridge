<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Models\Wallet;
use App\Models\WithdrawRequest;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RecruiterWithdrawController extends RecruiterBaseController
{
    public const MIN_WITHDRAW = 500;

    public function __construct(private NotificationService $notifications)
    {
    }

    public function index(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->query(), [
            'status' => 'nullable|in:pending,approved,rejected,cancelled',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $wallet = Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0]);
        $pending = WithdrawRequest::where('user_id', $user->id)->where('status', 'pending')->sum('amount');
        $withdrawn = WithdrawRequest::where('user_id', $user->id)->where('status', 'approved')->sum('amount');
        $historyQuery = WithdrawRequest::where('user_id', $user->id)->latest();

        if ($status = $request->query('status')) {
            $historyQuery->where('status', $status);
        }

        $history = $historyQuery->paginate(min((int) $request->query('per_page', 20), 100));
        $history->getCollection()->transform(fn (WithdrawRequest $withdraw) => $this->transform($withdraw));

        return $this->success([
            'available_balance' => max((float) $wallet->balance - (float) $pending, 0),
            'wallet_balance' => (float) $wallet->balance,
            'current_balance' => (float) $wallet->balance,
            'pending' => (float) $pending,
            'withdrawn' => (float) $withdrawn,
            'minimum_withdraw' => self::MIN_WITHDRAW,
            'history' => $history,
        ], 'Withdrawal details retrieved successfully.');
    }

    public function store(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:' . self::MIN_WITHDRAW,
            'bank_name' => 'required|string|max:255',
            'account_holder' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'ifsc' => 'nullable|string|max:20',
            'upi' => 'nullable|string|max:255',
            'remarks' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        if (! $request->filled('upi') && ! $request->filled('ifsc')) {
            return $this->validationError([
                'ifsc' => ['Provide IFSC or UPI for payout.'],
                'upi' => ['Provide UPI or IFSC for payout.'],
            ]);
        }

        $wallet = Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0]);
        $pending = WithdrawRequest::where('user_id', $user->id)->where('status', 'pending')->sum('amount');
        $available = max((float) $wallet->balance - (float) $pending, 0);
        $amount = (float) $request->input('amount');

        if ($amount > $available) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient available wallet balance.',
                'errors' => ['amount' => ['Insufficient available wallet balance.']],
                'data' => [
                    'available_balance' => $available,
                    'wallet_balance' => (float) $wallet->balance,
                    'pending_withdrawals' => (float) $pending,
                ],
            ], 422);
        }

        $payload = [
            'user_id' => $user->id,
            'amount' => $amount,
            'bank_name' => $request->input('bank_name'),
            'account_number' => $request->input('account_number'),
            'remarks' => $request->input('remarks'),
            'status' => 'pending',
        ];

        if ($this->hasColumn('account_holder')) {
            $payload['account_holder'] = $request->input('account_holder');
        }
        if ($this->hasColumn('ifsc')) {
            $payload['ifsc'] = $request->input('ifsc');
        }
        if ($this->hasColumn('upi')) {
            $payload['upi'] = $request->input('upi');
        } elseif ($request->filled('upi')) {
            $payload['remarks'] = $this->remarks($request->input('remarks'), $request->input('upi'));
        }

        $withdraw = WithdrawRequest::create($payload);

        $this->notifications->notify(
            $user,
            'Withdrawal request submitted',
            'Your withdrawal request of ₹' . number_format($amount, 2) . ' is pending review.',
            'withdraw',
            ['withdraw_request_id' => $withdraw->id, 'status' => 'pending']
        );

        return $this->success($this->transform($withdraw), 'Withdrawal request submitted successfully.', 201);
    }

    public function cancel(Request $request, int $id)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $withdraw = WithdrawRequest::where('user_id', $user->id)->find($id);
        if (! $withdraw) {
            return $this->notFound('Withdrawal request not found.');
        }

        if ($withdraw->status !== 'pending') {
            return $this->validationError(['status' => ['Only pending withdrawal requests can be cancelled.']]);
        }

        $withdraw->status = 'cancelled';
        $withdraw->processed_at = now();
        $withdraw->admin_remarks = trim(($withdraw->admin_remarks ? $withdraw->admin_remarks . "\n" : '') . 'Cancelled by recruiter.');
        $withdraw->save();

        $this->notifications->notify(
            $user,
            'Withdrawal request cancelled',
            'Your withdrawal request of ₹' . number_format((float) $withdraw->amount, 2) . ' was cancelled.',
            'withdraw',
            ['withdraw_request_id' => $withdraw->id, 'status' => 'cancelled']
        );

        return $this->success($this->transform($withdraw), 'Withdrawal request cancelled successfully.');
    }

    private function hasColumn(string $column): bool
    {
        return \Illuminate\Support\Facades\Schema::hasColumn('withdraw_requests', $column);
    }

    private function remarks(?string $remarks, ?string $upi): ?string
    {
        $parts = [];

        if ($upi) {
            $parts[] = 'UPI: ' . $upi;
        }

        if ($remarks) {
            $parts[] = $remarks;
        }

        return $parts ? implode("\n", $parts) : null;
    }

    private function transform(WithdrawRequest $withdraw): array
    {
        return [
            'id' => $withdraw->id,
            'amount' => (float) $withdraw->amount,
            'bank_name' => $withdraw->bank_name,
            'account_holder' => $withdraw->account_holder ?? null,
            'account_number' => $withdraw->account_number,
            'ifsc' => $withdraw->ifsc ?? null,
            'upi' => $withdraw->upi ?? null,
            'remarks' => $withdraw->remarks,
            'status' => $withdraw->status,
            'admin_remarks' => $withdraw->admin_remarks,
            'processed_at' => $withdraw->processed_at,
            'created_at' => $withdraw->created_at,
            'updated_at' => $withdraw->updated_at,
        ];
    }
}
