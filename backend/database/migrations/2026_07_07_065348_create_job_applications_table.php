<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_applications', function (Blueprint $table) {

            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('opportunity_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('resume')->nullable();

            $table->text('message')->nullable();

            $table->enum('status', [
                'Applied',
                'Under Review',
                'Shortlisted',
                'Interview Scheduled',
                'Technical Round',
                'Manager Round',
                'HR Round',
                'Offer Received',
                'Selected',
                'Joined',
                'Rejected',
            ])->default('Applied');

            $table->timestamp('applied_at')->useCurrent();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};