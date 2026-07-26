<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Models\RecruiterContactUnlock;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WithdrawRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;

class RecruiterWalletController extends RecruiterBaseController
{
    public function index(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $wallet = Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0]);
        $earnedUnlocks = RecruiterContactUnlock::where('recruiter_id', $user->id)->where('status', 'earned');
        $pendingUnlocks = RecruiterContactUnlock::where('recruiter_id', $user->id)->where('status', 'pending');
        $withdrawals = WithdrawRequest::where('user_id', $user->id);

        $todayEarnings = (clone $earnedUnlocks)->whereDate('unlocked_at', Carbon::today())->sum('amount');
        $monthlyEarnings = (clone $earnedUnlocks)
            ->whereMonth('unlocked_at', now()->month)
            ->whereYear('unlocked_at', now()->year)
            ->sum('amount');

        $lifetimeUnlocks = (float) (clone $earnedUnlocks)->sum('amount');
        $pendingWithdrawals = (float) (clone $withdrawals)->where('status', 'pending')->sum('amount');

        return $this->success([
            'balance' => (float) $wallet->balance,
            'pending_earnings' => (float) (clone $pendingUnlocks)->sum('amount'),
            'withdrawn' => (float) (clone $withdrawals)->where('status', 'approved')->sum('amount'),
            'today_earnings' => (float) $todayEarnings,
            'monthly_earnings' => (float) $monthlyEarnings,
            'contact_unlock_earnings' => $lifetimeUnlocks,
            'referral_earnings' => 0,
            'summary' => [
                'available_balance' => (float) $wallet->balance,
                'lifetime_earnings' => $lifetimeUnlocks,
                'pending_earnings' => (float) (clone $pendingUnlocks)->sum('amount'),
                'pending_withdrawals' => $pendingWithdrawals,
                'pending_balance' => (float) (clone $pendingUnlocks)->sum('amount') + $pendingWithdrawals,
                'total_withdrawn' => (float) WithdrawRequest::where('user_id', $user->id)->where('status', 'approved')->sum('amount'),
                'contact_unlock_earnings' => $lifetimeUnlocks,
                'referral_earnings' => 0,
                'successful_unlock_transactions' => WalletTransaction::where('user_id', $user->id)
                    ->where('category', 'unlock')
                    ->where('status', 'success')
                    ->count(),
            ],
        ], 'Wallet retrieved successfully.');
    }

    public function transactions(Request $request)
    {
        [$user, $error] = $this->recruiterUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->query(), [
            'category' => 'nullable|in:unlock,withdraw,refund,referral',
            'status' => 'nullable|in:success,pending,failed',
            'type' => 'nullable|in:credit,debit',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $query = WalletTransaction::where('user_id', $user->id)
            ->whereIn('category', ['unlock', 'withdraw', 'refund', 'referral']);

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('subtitle', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $transactions = $query->latest()
            ->paginate(min((int) $request->query('per_page', 20), 100));
        $transactions->getCollection()->transform(fn (WalletTransaction $transaction) => $this->transform($transaction));

        return $this->success($transactions, 'Wallet transactions retrieved successfully.');
    }

    private function transform(WalletTransaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'type' => $transaction->type,
            'category' => $transaction->category,
            'title' => $transaction->title,
            'subtitle' => $transaction->subtitle,
            'amount' => (float) $transaction->amount,
            'status' => $transaction->status,
            'reference' => $transaction->reference,
            'created_at' => $transaction->created_at,
            'updated_at' => $transaction->updated_at,
        ];
    }
}
