<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('recruiter_profiles')) {
            Schema::table('recruiter_profiles', function (Blueprint $table) {
                if (! Schema::hasColumn('recruiter_profiles', 'rejection_reason')) {
                    $table->text('rejection_reason')->nullable()->after('admin_remarks');
                }
                if (! Schema::hasColumn('recruiter_profiles', 'required_changes')) {
                    $table->text('required_changes')->nullable()->after('rejection_reason');
                }
                if (! Schema::hasColumn('recruiter_profiles', 'internal_notes')) {
                    $table->text('internal_notes')->nullable()->after('required_changes');
                }
                if (! Schema::hasColumn('recruiter_profiles', 'reviewed_by')) {
                    $table->foreignId('reviewed_by')->nullable()->after('reviewed_at')
                        ->constrained('users')->nullOnDelete();
                }
                if (! Schema::hasColumn('recruiter_profiles', 'suspended_at')) {
                    $table->timestamp('suspended_at')->nullable()->after('reviewed_by');
                }
            });

            // Retire unused agency recruiter subtype without dropping historical rows.
            if (Schema::hasColumn('recruiter_profiles', 'recruiter_type')) {
                DB::table('recruiter_profiles')
                    ->where('recruiter_type', 'hr_agency')
                    ->update(['recruiter_type' => 'consultancy']);
            }
        }

        if (! Schema::hasTable('recruiter_admin_actions')) {
            Schema::create('recruiter_admin_actions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('recruiter_profile_id')->constrained('recruiter_profiles')->cascadeOnDelete();
                $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();
                $table->string('action', 40);
                $table->string('from_status', 40)->nullable();
                $table->string('to_status', 40)->nullable();
                $table->string('reason')->nullable();
                $table->text('notes')->nullable();
                $table->text('required_changes')->nullable();
                $table->boolean('is_internal_note')->default(false);
                $table->timestamps();

                $table->index(['recruiter_profile_id', 'created_at']);
                $table->index('action');
            });
        }

        // Convert leftover HR role accounts to recruiters so auth remains valid.
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'role')) {
            DB::table('users')->where('role', 'hr')->update(['role' => 'opportunity_provider']);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('recruiter_admin_actions');

        if (Schema::hasTable('recruiter_profiles')) {
            Schema::table('recruiter_profiles', function (Blueprint $table) {
                if (Schema::hasColumn('recruiter_profiles', 'reviewed_by')) {
                    $table->dropConstrainedForeignId('reviewed_by');
                }
                foreach (['rejection_reason', 'required_changes', 'internal_notes', 'suspended_at'] as $column) {
                    if (Schema::hasColumn('recruiter_profiles', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
