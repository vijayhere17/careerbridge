<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('recruiter_opportunities')) {
            Schema::table('recruiter_opportunities', function (Blueprint $table) {
                if (! Schema::hasColumn('recruiter_opportunities', 'duplicated_from_id')) {
                    $table->foreignId('duplicated_from_id')
                        ->nullable()
                        ->constrained('recruiter_opportunities')
                        ->nullOnDelete();
                }
                if (! Schema::hasColumn('recruiter_opportunities', 'contact_price')) {
                    $table->decimal('contact_price', 10, 2)->nullable();
                }
                if (! Schema::hasColumn('recruiter_opportunities', 'unlocks_count')) {
                    $table->unsignedInteger('unlocks_count')->default(0);
                }
                if (! Schema::hasColumn('recruiter_opportunities', 'published_at')) {
                    $table->timestamp('published_at')->nullable();
                }
                if (! Schema::hasColumn('recruiter_opportunities', 'closed_at')) {
                    $table->timestamp('closed_at')->nullable();
                }
                if (! Schema::hasColumn('recruiter_opportunities', 'archived_at')) {
                    $table->timestamp('archived_at')->nullable();
                }
            });
        }

        if (! Schema::hasTable('recruiter_applications')) {
            Schema::create('recruiter_applications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('recruiter_opportunity_id')
                    ->constrained('recruiter_opportunities')
                    ->cascadeOnDelete();
                $table->foreignId('candidate_id')->constrained('users')->cascadeOnDelete();
                $table->string('status')->default('new');
                $table->unsignedTinyInteger('rating')->nullable();
                $table->string('resume_path')->nullable();
                $table->text('message')->nullable();
                $table->text('recruiter_notes')->nullable();
                $table->decimal('expected_salary', 12, 2)->nullable();
                $table->string('interview_status')->nullable();
                $table->dateTime('interview_at')->nullable();
                $table->string('interview_link')->nullable();
                $table->timestamp('applied_at')->nullable();
                $table->timestamps();

                $table->unique(['recruiter_opportunity_id', 'candidate_id'], 'recruiter_app_unique');
                $table->index(['status', 'applied_at']);
            });
        }

        if (! Schema::hasTable('recruiter_contact_unlocks')) {
            Schema::create('recruiter_contact_unlocks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('recruiter_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('candidate_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('recruiter_opportunity_id')
                    ->nullable()
                    ->constrained('recruiter_opportunities')
                    ->nullOnDelete();
                $table->foreignId('recruiter_application_id')
                    ->nullable()
                    ->constrained('recruiter_applications')
                    ->nullOnDelete();
                $table->decimal('amount', 10, 2)->default(0);
                $table->string('status')->default('earned');
                $table->timestamp('unlocked_at')->nullable();
                $table->timestamps();

                $table->index(['recruiter_id', 'unlocked_at']);
                $table->index('status');
            });
        }
    }

    public function down(): void
    {
        // Keep tables — this migration only ensures missing runtime schema exists.
    }
};
