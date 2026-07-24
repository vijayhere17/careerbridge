<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\WithdrawRequestResource;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WithdrawRequest;
use Illuminate\Http\Request;

class MentorWithdrawController extends Controller
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

        $pendingWithdraw = WithdrawRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');

        $totalWithdrawn = WithdrawRequest::where('user_id', $user->id)
            ->where('status', 'approved')
            ->sum('amount');

        $history = WithdrawRequest::where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([

            'summary' => [

                'available_balance' => (float) $wallet->balance,

                'pending_withdraw' => (float) $pendingWithdraw,

                'total_withdrawn' => (float) $totalWithdrawn,

            ],

            'history' => WithdrawRequestResource::collection($history),

        ]);
    }

    public function store(Request $request)
{
    $user = $this->authUser($request);

    if (!$user) {
        return response()->json([
            'message' => 'Unauthorized',
        ], 401);
    }

    $request->validate([

        'amount' => 'required|numeric|min:500',

        'bank_name' => 'required|string|max:255',

        'account_number' => 'required|string|max:255',

        'remarks' => 'nullable|string',

    ]);

    $wallet = Wallet::firstOrCreate(
        ['user_id' => $user->id],
        ['balance' => 0]
    );

    if ($request->amount > $wallet->balance) {

        return response()->json([
            'message' => 'Insufficient wallet balance.',
        ], 422);

    }

    $withdraw = WithdrawRequest::create([

        'user_id' => $user->id,

        'amount' => $request->amount,

        'bank_name' => $request->bank_name,

        'account_number' => $request->account_number,

        'remarks' => $request->remarks,

        'status' => 'pending',

    ]);

    return response()->json([

        'success' => true,

        'message' => 'Withdrawal request submitted successfully.',

        'withdraw' => new WithdrawRequestResource($withdraw),

    ]);

}
}