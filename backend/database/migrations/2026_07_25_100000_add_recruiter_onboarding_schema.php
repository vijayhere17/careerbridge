<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'verified_email')) {
                $table->boolean('verified_email')->default(false)->after('email_verified_at');
            }

            if (! Schema::hasColumn('users', 'verified_mobile')) {
                $table->boolean('verified_mobile')->default(false)->after('mobile');
            }

            if (! Schema::hasColumn('users', 'mobile_verified_at')) {
                $table->timestamp('mobile_verified_at')->nullable()->after('verified_mobile');
            }
        });

        // Keep existing verified accounts in sync with the new boolean flags.
        if (Schema::hasColumn('users', 'verified_email')) {
            DB::table('users')
                ->whereNotNull('email_verified_at')
                ->update(['verified_email' => true]);
        }

        if (! Schema::hasTable('recruiter_profiles')) {
            Schema::create('recruiter_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();

                $table->string('company_name')->nullable();
                $table->string('company_logo')->nullable();
                $table->string('recruiter_name')->nullable();
                $table->string('designation')->nullable();
                $table->text('about_company')->nullable();
                $table->text('company_description')->nullable();
                $table->string('industry')->nullable();
                $table->string('company_size')->nullable();
                $table->string('website')->nullable();
                $table->string('email')->nullable();
                $table->string('phone', 30)->nullable();

                $table->string('office_address')->nullable();
                $table->string('city')->nullable();
                $table->string('state')->nullable();
                $table->string('country')->nullable();
                $table->string('pin_code', 20)->nullable();

                $table->string('linkedin')->nullable();
                $table->string('facebook')->nullable();
                $table->string('instagram')->nullable();
                $table->string('twitter')->nullable();

                $table->string('company_registration_number')->nullable();
                $table->string('gst_number')->nullable();

                $table->string('recruiter_type')->nullable();

                $table->string('approval_status')->default('Pending');
                $table->text('admin_remarks')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->timestamp('reviewed_at')->nullable();

                $table->unsignedTinyInteger('profile_completion')->default(0);
                $table->string('onboarding_step')->default('verification');

                $table->timestamps();

                $table->unique('user_id');
                $table->index('approval_status');
                $table->index('recruiter_type');
            });
        }

        // Existing opportunity providers keep dashboard access (grandfathered as approved).
        $now = now();
        $providers = DB::table('users')
            ->where('role', 'opportunity_provider')
            ->get(['id', 'name', 'email', 'mobile', 'company', 'current_role', 'location', 'bio', 'linkedin']);

        foreach ($providers as $provider) {
            $exists = DB::table('recruiter_profiles')->where('user_id', $provider->id)->exists();
            if ($exists) {
                continue;
            }

            DB::table('recruiter_profiles')->insert([
                'user_id' => $provider->id,
                'company_name' => $provider->company,
                'recruiter_name' => $provider->name,
                'designation' => $provider->current_role,
                'about_company' => $provider->bio,
                'company_description' => $provider->bio,
                'email' => $provider->email,
                'phone' => $provider->mobile,
                'linkedin' => $provider->linkedin,
                'recruiter_type' => 'company_recruiter',
                'approval_status' => 'Approved',
                'submitted_at' => $now,
                'reviewed_at' => $now,
                'profile_completion' => 100,
                'onboarding_step' => 'complete',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('users')->where('id', $provider->id)->update([
                'verified_email' => true,
                'verified_mobile' => true,
                'mobile_verified_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('recruiter_profiles');

        Schema::table('users', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::hasColumn('users', 'verified_email') ? 'verified_email' : null,
                Schema::hasColumn('users', 'verified_mobile') ? 'verified_mobile' : null,
                Schema::hasColumn('users', 'mobile_verified_at') ? 'mobile_verified_at' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
