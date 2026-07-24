<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mentor_profiles', function (Blueprint $table) {

            $table->string('linkedin_url')->nullable()->after('profile_photo');

            $table->string('portfolio_url')->nullable()->after('linkedin_url');

            $table->string('resume')->nullable()->after('portfolio_url');

            $table->longText('professional_summary')->nullable()->after('resume');

        });
    }

    public function down(): void
    {
        Schema::table('mentor_profiles', function (Blueprint $table) {

            $table->dropColumn([
                'linkedin_url',
                'portfolio_url',
                'resume',
                'professional_summary'
            ]);

        });
    }
};