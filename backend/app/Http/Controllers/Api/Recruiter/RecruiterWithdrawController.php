<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Models\Wallet;
use App\Models\WithdrawRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RecruiterWithdrawController extends RecruiterBaseController
{
    public function index(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->query(), [
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $wallet = Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0]);
        $pending = WithdrawRequest::where('user_id', $user->id)->where('status', 'pending')->sum('amount');
        $withdrawn = WithdrawRequest::where('user_id', $user->id)->where('status', 'approved')->sum('amount');
        $history = WithdrawRequest::where('user_id', $user->id)
            ->latest()
            ->paginate(min((int) $request->query('per_page', 20), 100));
        $history->getCollection()->transform(fn (WithdrawRequest $withdraw) => $this->transform($withdraw));

        return $this->success([
            'available_balance' => max((float) $wallet->balance - (float) $pending, 0),
            'wallet_balance' => (float) $wallet->balance,
            'pending' => (float) $pending,
            'withdrawn' => (float) $withdrawn,
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
            'amount' => 'required|numeric|min:500',
            'bank_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'upi' => 'nullable|string|max:255',
            'remarks' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $wallet = Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0]);
        $pending = WithdrawRequest::where('user_id', $user->id)->where('status', 'pending')->sum('amount');
        $available = max((float) $wallet->balance - (float) $pending, 0);
        $amount = (float) $request->input('amount');

        if ($amount > $available) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient available wallet balance.',
                'data' => [
                    'available_balance' => $available,
                    'wallet_balance' => (float) $wallet->balance,
                    'pending_withdrawals' => (float) $pending,
                ],
            ], 422);
        }

        $withdraw = WithdrawRequest::create([
            'user_id' => $user->id,
            'amount' => $amount,
            'bank_name' => $request->input('bank_name'),
            'account_number' => $request->input('account_number'),
            'remarks' => $this->remarks($request->input('remarks'), $request->input('upi')),
            'status' => 'pending',
        ]);

        return $this->success($this->transform($withdraw), 'Withdrawal request submitted successfully.', 201);
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
            'account_number' => $withdraw->account_number,
            'remarks' => $withdraw->remarks,
            'status' => $withdraw->status,
            'admin_remarks' => $withdraw->admin_remarks,
            'processed_at' => $withdraw->processed_at,
            'created_at' => $withdraw->created_at,
            'updated_at' => $withdraw->updated_at,
        ];
    }
}
