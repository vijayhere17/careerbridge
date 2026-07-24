<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->enum('type', [
                'credit',
                'debit'
            ]);

            $table->enum('category', [
                'deposit',
                'session',
                'unlock',
                'refund',
                'withdraw'
            ]);

            $table->string('title');
            $table->string('subtitle')->nullable();

            $table->decimal('amount', 12, 2);

            $table->enum('status', [
                'success',
                'pending',
                'failed'
            ])->default('pending');

            $table->string('reference')->unique();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};