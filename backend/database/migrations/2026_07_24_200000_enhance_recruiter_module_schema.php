<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recruiter_opportunities', function (Blueprint $table) {
            $table->foreignId('duplicated_from_id')
                ->nullable()
                ->after('user_id')
                ->constrained('recruiter_opportunities')
                ->nullOnDelete();
            $table->decimal('contact_price', 10, 2)->nullable()->after('contact_visibility');
            $table->unsignedInteger('unlocks_count')->default(0)->after('applications_count');
            $table->timestamp('published_at')->nullable()->after('unlocks_count');
            $table->timestamp('closed_at')->nullable()->after('published_at');
            $table->timestamp('archived_at')->nullable()->after('closed_at');
            $table->index(['user_id', 'status']);
        });

        DB::statement("ALTER TABLE recruiter_opportunities MODIFY status ENUM('draft','published','closed','archived','paused') NOT NULL DEFAULT 'draft'");

        Schema::create('recruiter_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruiter_opportunity_id')
                ->constrained('recruiter_opportunities')
                ->cascadeOnDelete();
            $table->foreignId('candidate_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('new'); // new, shortlisted, interview, rejected, hired
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
            $table->string('status')->default('earned'); // earned, pending, refunded
            $table->timestamp('unlocked_at')->nullable();
            $table->timestamps();

            $table->index(['recruiter_id', 'unlocked_at']);
            $table->index('status');
        });

        if (Schema::hasTable('notifications')) {
            try {
                DB::statement("ALTER TABLE notifications MODIFY type ENUM(
                    'booking','payment','review','system','application','interview','offer','job','hr','recruiter','unlock','withdraw'
                ) NOT NULL");
            } catch (\Throwable $e) {
                // ignore if already expanded or non-mysql
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('recruiter_contact_unlocks');
        Schema::dropIfExists('recruiter_applications');

        Schema::table('recruiter_opportunities', function (Blueprint $table) {
            $table->dropConstrainedForeignId('duplicated_from_id');
            $table->dropColumn([
                'contact_price',
                'unlocks_count',
                'published_at',
                'closed_at',
                'archived_at',
            ]);
        });

        DB::statement("ALTER TABLE recruiter_opportunities MODIFY status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft'");
    }
};
