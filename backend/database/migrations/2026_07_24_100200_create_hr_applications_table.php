<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('hr_jobs')->cascadeOnDelete();
            $table->foreignId('candidate_id')->constrained('users')->cascadeOnDelete();
            $table->enum('current_stage', [
                'applied',
                'screening',
                'technical',
                'hr',
                'final',
                'offer',
                'joined',
                'rejected',
            ])->default('applied');
            $table->unsignedTinyInteger('rating')->nullable();
            $table->dateTime('interview_date')->nullable();
            $table->string('interview_mode')->nullable();
            $table->string('interview_link')->nullable();
            $table->text('interviewer_notes')->nullable();
            $table->text('hr_notes')->nullable();
            $table->decimal('offer_salary', 12, 2)->nullable();
            $table->enum('offer_status', ['none', 'pending', 'accepted', 'declined'])->default('none');
            $table->date('joined_date')->nullable();
            $table->text('rejected_reason')->nullable();
            $table->timestamps();

            $table->unique(['job_id', 'candidate_id']);
            $table->index(['job_id', 'current_stage']);
            $table->index('candidate_id');
            $table->index('rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_applications');
    }
};
