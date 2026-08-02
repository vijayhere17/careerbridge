<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MentorEarningTransactionResource;
use App\Models\MentorBooking;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;

class MentorEarningsController extends Controller
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

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $wallet = Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        $transactions = WalletTransaction::where('user_id', $user->id)
    ->latest()
    ->get();

       $totalEarnings = WalletTransaction::where('user_id', $user->id)
            ->where('type', 'credit')
            ->sum('amount');

        $pendingWallet = (float) WalletTransaction::where('user_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');

        // Escrow held on confirmed sessions (mentor share = 70% of session fee)
        $escrowPending = 0.0;
        $mentorProfile = $user->mentorProfile;
        if ($mentorProfile) {
            $escrowPending = (float) MentorBooking::with('service')
                ->where('mentor_id', $mentorProfile->id)
                ->where('status', 'confirmed')
                ->whereIn('payment_status', ['escrow', 'pending'])
                ->get()
                ->sum(function (MentorBooking $booking) {
                    $fee = (float) ($booking->service?->price ?? $booking->amount);

                    return round(max($fee, 0) * 0.7, 2);
                });
        }

        $pendingBalance = $pendingWallet + $escrowPending;

        $thisMonth = WalletTransaction::where('user_id', $user->id)
            ->where('type', 'credit')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        $monthly = [];

        for ($i = 1; $i <= 12; $i++) {

            $monthly[] = [

                'month' => date('M', mktime(0, 0, 0, $i, 1)),

                'amount' => (float) WalletTransaction::where('user_id', $user->id)
                    ->where('type', 'credit')
                    ->whereMonth('created_at', $i)
                    ->whereYear('created_at', now()->year)
                    ->sum('amount'),

            ];
        }

        $breakdown = WalletTransaction::where('user_id', $user->id)
            ->where('type', 'credit')
            ->selectRaw('category, SUM(amount) as amount')
            ->groupBy('category')
            ->get()
            ->map(function ($item) use ($totalEarnings) {

                return [

                    'service' => $item->category,

                    'amount' => (float) $item->amount,

                    'percentage' => $totalEarnings > 0
                        ? round(($item->amount / $totalEarnings) * 100)
                        : 0,

                ];

            });

        return response()->json([

            'summary' => [

                'total_earnings' => (float) $totalEarnings,

                'available_balance' => (float) $wallet->balance,

                'pending_balance' => (float) $pendingBalance,

                'this_month' => (float) $thisMonth,

            ],

            'monthly' => $monthly,

            'breakdown' => $breakdown,

            'transactions' => MentorEarningTransactionResource::collection(
                $transactions
            ),

        ]);
    }
}