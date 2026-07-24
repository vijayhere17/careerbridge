<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hr_jobs', function (Blueprint $table) {
            $table->foreignId('duplicated_from_job_id')
                ->nullable()
                ->after('recruiter_opportunity_id')
                ->constrained('hr_jobs')
                ->nullOnDelete();
            $table->timestamp('archived_at')->nullable()->after('closed_at');
            $table->index('archived_at');
        });

        // Expand job status enum to include archived
        DB::statement("ALTER TABLE hr_jobs MODIFY status ENUM('draft','open','closed','on_hold','archived') NOT NULL DEFAULT 'draft'");

        Schema::table('hr_applications', function (Blueprint $table) {
            $table->string('source')->nullable()->after('candidate_id');
            $table->decimal('expected_salary', 12, 2)->nullable()->after('source');
            $table->string('resume_path')->nullable()->after('expected_salary');
            $table->timestamp('applied_at')->nullable()->after('resume_path');
            $table->timestamp('shortlisted_at')->nullable()->after('applied_at');
            $table->timestamp('rejected_at')->nullable()->after('shortlisted_at');
            $table->timestamp('offer_sent_at')->nullable()->after('rejected_at');
            $table->timestamp('stage_changed_at')->nullable()->after('offer_sent_at');
            $table->unsignedInteger('stage_order')->default(0)->after('stage_changed_at');
            $table->index('source');
            $table->index('applied_at');
        });

        // Expand application stages for full ATS pipeline
        DB::statement("ALTER TABLE hr_applications MODIFY current_stage ENUM(
            'applied',
            'screening',
            'technical',
            'hr',
            'hr_round',
            'manager_round',
            'final',
            'final_interview',
            'offer',
            'joined',
            'rejected'
        ) NOT NULL DEFAULT 'applied'");

        DB::table('hr_applications')->where('current_stage', 'hr')->update(['current_stage' => 'hr_round']);
        DB::table('hr_applications')->where('current_stage', 'final')->update(['current_stage' => 'final_interview']);

        DB::statement("ALTER TABLE hr_applications MODIFY current_stage ENUM(
            'applied',
            'screening',
            'technical',
            'hr_round',
            'manager_round',
            'final_interview',
            'offer',
            'joined',
            'rejected'
        ) NOT NULL DEFAULT 'applied'");

        Schema::table('hr_interviews', function (Blueprint $table) {
            $table->json('panel')->nullable()->after('interviewer_name');
            $table->text('notes')->nullable()->after('feedback');
            $table->unsignedTinyInteger('rating')->nullable()->after('notes');
            $table->string('result')->nullable()->after('rating');
            $table->timestamp('completed_at')->nullable()->after('result');
            $table->timestamp('cancelled_at')->nullable()->after('completed_at');
            $table->timestamp('rescheduled_at')->nullable()->after('cancelled_at');
        });

        Schema::table('hr_profiles', function (Blueprint $table) {
            $table->string('company_cover')->nullable()->after('company_logo');
            $table->text('culture')->nullable()->after('company_description');
            $table->text('benefits')->nullable()->after('culture');
            $table->json('locations')->nullable()->after('office_location');
            $table->json('social_links')->nullable()->after('linkedin');
        });

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'resume_path')) {
                $table->string('resume_path')->nullable()->after('profile_photo');
            }
            if (!Schema::hasColumn('users', 'projects')) {
                $table->json('projects')->nullable()->after('skills');
            }
            if (!Schema::hasColumn('users', 'certificates')) {
                $table->json('certificates')->nullable()->after('projects');
            }
            if (!Schema::hasColumn('users', 'languages')) {
                $table->json('languages')->nullable()->after('certificates');
            }
            if (!Schema::hasColumn('users', 'tags')) {
                $table->json('tags')->nullable()->after('languages');
            }
            if (!Schema::hasColumn('users', 'hr_preferences')) {
                $table->json('hr_preferences')->nullable()->after('looking_for');
            }
        });

        Schema::create('hr_application_timelines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('hr_applications')->cascadeOnDelete();
            $table->foreignId('hr_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event');
            $table->string('from_stage')->nullable();
            $table->string('to_stage')->nullable();
            $table->text('description')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['application_id', 'created_at']);
        });

        // Expand notification types for HR events
        DB::statement("ALTER TABLE notifications MODIFY type ENUM(
            'booking',
            'payment',
            'review',
            'system',
            'application',
            'interview',
            'offer',
            'job',
            'hr'
        ) NOT NULL");
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_application_timelines');

        Schema::table('hr_profiles', function (Blueprint $table) {
            $table->dropColumn(['company_cover', 'culture', 'benefits', 'locations', 'social_links']);
        });

        Schema::table('hr_interviews', function (Blueprint $table) {
            $table->dropColumn([
                'panel',
                'notes',
                'rating',
                'result',
                'completed_at',
                'cancelled_at',
                'rescheduled_at',
            ]);
        });

        DB::table('hr_applications')->where('current_stage', 'hr_round')->update(['current_stage' => 'hr']);
        DB::table('hr_applications')->where('current_stage', 'final_interview')->update(['current_stage' => 'final']);
        DB::table('hr_applications')->where('current_stage', 'manager_round')->update(['current_stage' => 'final']);

        DB::statement("ALTER TABLE hr_applications MODIFY current_stage ENUM(
            'applied','screening','technical','hr','final','offer','joined','rejected'
        ) NOT NULL DEFAULT 'applied'");

        Schema::table('hr_applications', function (Blueprint $table) {
            $table->dropColumn([
                'source',
                'expected_salary',
                'resume_path',
                'applied_at',
                'shortlisted_at',
                'rejected_at',
                'offer_sent_at',
                'stage_changed_at',
                'stage_order',
            ]);
        });

        DB::statement("ALTER TABLE hr_jobs MODIFY status ENUM('draft','open','closed','on_hold') NOT NULL DEFAULT 'draft'");

        Schema::table('hr_jobs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('duplicated_from_job_id');
            $table->dropColumn('archived_at');
        });

        Schema::table('users', function (Blueprint $table) {
            foreach (['resume_path', 'projects', 'certificates', 'languages', 'tags', 'hr_preferences'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        DB::statement("ALTER TABLE notifications MODIFY type ENUM('booking','payment','review','system') NOT NULL");
    }
};
