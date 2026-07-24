<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {

            $table->string('last_name')->nullable()->after('name');

            $table->string('profile_photo')->nullable();

            $table->string('experience')->nullable();

            $table->string('education')->nullable();

            $table->text('skills')->nullable();

            $table->text('linkedin')->nullable();

            $table->text('github')->nullable();

            $table->text('portfolio')->nullable();

            $table->text('looking_for')->nullable();

        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {

            $table->dropColumn([
                'last_name',
                'profile_photo',
                'experience',
                'education',
                'skills',
                'linkedin',
                'github',
                'portfolio',
                'looking_for',
            ]);

        });
    }
};