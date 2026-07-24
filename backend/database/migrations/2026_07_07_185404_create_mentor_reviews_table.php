<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('mentor_reviews', function (Blueprint $table) {

            $table->id();

            // IDs (no foreign keys for now)
            $table->unsignedBigInteger('booking_id');
            $table->unsignedBigInteger('mentor_id');
            $table->unsignedBigInteger('user_id');

            // Review
            $table->unsignedTinyInteger('rating')->nullable();
            $table->text('comment')->nullable();

            // Review status
            $table->enum('status', [
                'pending',
                'submitted',
            ])->default('pending');

            // Helpful count
            $table->unsignedInteger('helpful_count')->default(0);

            // Submission date
            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mentor_reviews');
    }
};