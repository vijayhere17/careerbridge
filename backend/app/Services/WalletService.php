<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class WalletService
{
    public function ensureWallet(User $user): Wallet
    {
        return Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );
    }

    public function credit(
        User $user,
        float $amount,
        string $category,
        string $title,
        ?string $subtitle = null,
        string $status = 'success',
        ?string $reference = null,
    ): WalletTransaction {
        if ($amount <= 0) {
            throw new InvalidArgumentException('Credit amount must be positive.');
        }

        return DB::transaction(function () use ($user, $amount, $category, $title, $subtitle, $status, $reference) {
            $wallet = $this->ensureWallet($user);
            $wallet->balance = round(((float) $wallet->balance) + $amount, 2);
            $wallet->save();

            return WalletTransaction::create([
                'user_id' => $user->id,
                'type' => 'credit',
                'category' => $category,
                'title' => $title,
                'subtitle' => $subtitle,
                'amount' => $amount,
                'status' => $status,
                'reference' => $reference ?: ('CR-' . Str::upper(Str::random(10))),
            ]);
        });
    }

    public function debit(
        User $user,
        float $amount,
        string $category,
        string $title,
        ?string $subtitle = null,
        string $status = 'success',
        ?string $reference = null,
    ): WalletTransaction {
        if ($amount <= 0) {
            throw new InvalidArgumentException('Debit amount must be positive.');
        }

        return DB::transaction(function () use ($user, $amount, $category, $title, $subtitle, $status, $reference) {
            $wallet = $this->ensureWallet($user);
            if ((float) $wallet->balance < $amount) {
                throw new InvalidArgumentException('Insufficient wallet balance.');
            }

            $wallet->balance = round(((float) $wallet->balance) - $amount, 2);
            $wallet->save();

            return WalletTransaction::create([
                'user_id' => $user->id,
                'type' => 'debit',
                'category' => $category,
                'title' => $title,
                'subtitle' => $subtitle,
                'amount' => $amount,
                'status' => $status,
                'reference' => $reference ?: ('DR-' . Str::upper(Str::random(10))),
            ]);
        });
    }
}
