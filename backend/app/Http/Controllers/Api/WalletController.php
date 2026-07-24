<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    /**
     * GET /api/wallet
     */
    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 401);
        }

        $wallet = Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        $transactions = WalletTransaction::where('user_id', $user->id)
            ->where('status', 'success')
            ->get();

        return response()->json([
            'balance' => (float) $wallet->balance,

            'summary' => [
                'totalAdded' => $transactions
                    ->where('type', 'credit')
                    ->where('category', 'deposit')
                    ->sum('amount'),

                'totalSpent' => $transactions
                    ->where('type', 'debit')
                    ->sum('amount'),

                'refunds' => $transactions
                    ->where('category', 'refund')
                    ->sum('amount'),
            ],
        ]);
    }

    /**
     * GET /api/wallet/transactions
     */
    public function transactions(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 401);
        }

        return response()->json([
            'transactions' => WalletTransaction::where('user_id', $user->id)
                ->latest()
                ->get(),
        ]);
    }
}