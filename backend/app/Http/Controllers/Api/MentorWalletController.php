<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WithdrawRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MentorWalletController extends Controller
{
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
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $wallet = Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        $credits = WalletTransaction::where('user_id', $user->id)
            ->where('type', 'credit')
            ->where('status', 'success');

        $pendingWithdraw = (float) WithdrawRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');

        $pendingTx = (float) WalletTransaction::where('user_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');

        $lifetime = (float) (clone $credits)->sum('amount');
        $monthly = (float) (clone $credits)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');
        $today = (float) (clone $credits)
            ->whereDate('created_at', Carbon::today())
            ->sum('amount');
        $bookingEarnings = (float) WalletTransaction::where('user_id', $user->id)
            ->where('type', 'credit')
            ->where('status', 'success')
            ->whereIn('category', ['session', 'booking'])
            ->sum('amount');

        return response()->json([
            'balance' => (float) $wallet->balance,
            'summary' => [
                'available_balance' => max((float) $wallet->balance - $pendingWithdraw, 0),
                'pending_balance' => $pendingTx + $pendingWithdraw,
                'pending_withdrawals' => $pendingWithdraw,
                'lifetime_earnings' => $lifetime,
                'monthly_earnings' => $monthly,
                'today_earnings' => $today,
                'booking_earnings' => $bookingEarnings,
                'referral_earnings' => 0,
                'total_withdrawn' => (float) WithdrawRequest::where('user_id', $user->id)
                    ->where('status', 'approved')
                    ->sum('amount'),
            ],
        ]);
    }

    public function transactions(Request $request)
    {
        $user = $this->authUser($request);

        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'category' => 'nullable|string|max:50',
            'type' => 'nullable|in:credit,debit',
            'status' => 'nullable|string|max:50',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $query = WalletTransaction::where('user_id', $user->id);

        if (! empty($validated['category'])) {
            $query->where('category', $validated['category']);
        }

        if (! empty($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('subtitle', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $transactions = $query->latest()
            ->paginate(min((int) ($validated['per_page'] ?? 20), 100));

        $transactions->getCollection()->transform(function (WalletTransaction $tx) {
            return [
                'id' => $tx->id,
                'type' => $tx->type,
                'category' => $tx->category,
                'title' => $tx->title,
                'subtitle' => $tx->subtitle,
                'amount' => (float) $tx->amount,
                'status' => $tx->status,
                'reference' => $tx->reference,
                'created_at' => optional($tx->created_at)->toIso8601String(),
            ];
        });

        return response()->json([
            'transactions' => $transactions,
        ]);
    }
}
