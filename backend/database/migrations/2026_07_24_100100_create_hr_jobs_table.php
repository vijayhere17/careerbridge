<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hr_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('recruiter_opportunity_id')
                ->nullable()
                ->constrained('recruiter_opportunities')
                ->nullOnDelete();
            $table->string('title');
            $table->string('department')->nullable();
            $table->string('location')->nullable();
            $table->string('employment_type')->nullable();
            $table->string('experience')->nullable();
            $table->decimal('salary_min', 12, 2)->nullable();
            $table->decimal('salary_max', 12, 2)->nullable();
            $table->unsignedInteger('openings')->default(1);
            $table->enum('status', ['draft', 'open', 'closed', 'on_hold'])->default('draft');
            $table->text('description')->nullable();
            $table->text('requirements')->nullable();
            $table->text('responsibilities')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['hr_id', 'status']);
            $table->index('department');
            $table->index('published_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_jobs');
    }
};
