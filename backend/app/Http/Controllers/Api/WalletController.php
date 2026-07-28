<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WalletController extends Controller
{
    public function __construct(private WalletService $walletService)
    {
    }

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
                ->get()
                ->map(function (WalletTransaction $tx) {
                    return [
                        'id' => (string) $tx->id,
                        'type' => $tx->type,
                        'category' => $tx->category,
                        'title' => $tx->title,
                        'subtitle' => $tx->subtitle,
                        'amount' => (float) $tx->amount,
                        'date' => optional($tx->created_at)->toDateString(),
                        'status' => $tx->status,
                        'ref' => $tx->reference,
                        'created_at' => optional($tx->created_at)->toIso8601String(),
                    ];
                }),
        ]);
    }

    /**
     * POST /api/wallet/topup
     * Simulated payment provider (UPI / card / netbanking) that credits the wallet.
     */
    public function topup(Request $request)
    {
        $user = $this->authUser($request);

        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:100|max:50000',
            'method' => 'required|in:upi,card,netbanking,wallet',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $amount = (float) $request->input('amount');
        $method = (string) $request->input('method');

        $labels = [
            'upi' => 'UPI',
            'card' => 'Card',
            'netbanking' => 'Net Banking',
            'wallet' => 'Wallet',
        ];

        $tx = $this->walletService->credit(
            $user,
            $amount,
            'deposit',
            'Wallet Top-up',
            ($labels[$method] ?? 'Payment') . ' payment',
            'success'
        );

        $wallet = Wallet::where('user_id', $user->id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Wallet topped up successfully.',
            'balance' => (float) ($wallet?->balance ?? 0),
            'transaction' => [
                'id' => (string) $tx->id,
                'amount' => (float) $tx->amount,
                'reference' => $tx->reference,
                'method' => $method,
            ],
        ], 201);
    }
}