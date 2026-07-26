<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('hr_application_timelines');
        Schema::dropIfExists('hr_activity_logs');
        Schema::dropIfExists('hr_interviews');
        Schema::dropIfExists('hr_candidate_notes');
        Schema::dropIfExists('hr_applications');
        Schema::dropIfExists('hr_jobs');
        Schema::dropIfExists('hr_profiles');

        // Keep users.hr_preferences column for existing recruiter settings JSON storage.
        // It is no longer an HR-role field; rename would risk breaking live data.
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'role')) {
            // no-op marker for clarity
        }
    }

    public function down(): void
    {
        // Intentionally empty — HR module is retired.
    }
};
