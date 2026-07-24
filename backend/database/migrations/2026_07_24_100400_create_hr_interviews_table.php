<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('hr_applications')->cascadeOnDelete();
            $table->foreignId('hr_id')->constrained('users')->cascadeOnDelete();
            $table->string('interviewer_name')->nullable();
            $table->string('interview_type')->nullable();
            $table->string('meeting_link')->nullable();
            $table->dateTime('scheduled_at');
            $table->unsignedInteger('duration')->default(30);
            $table->enum('status', ['scheduled', 'completed', 'cancelled', 'no_show'])->default('scheduled');
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->index(['hr_id', 'status']);
            $table->index('scheduled_at');
            $table->index('application_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_interviews');
    }
};
