<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('seeker')->after('email');
            $table->string('api_token', 80)->nullable()->unique()->after('role');
            $table->string('company')->nullable()->after('api_token');
            $table->string('current_role')->nullable()->after('company');
            $table->string('target_roles')->nullable()->after('current_role');
            $table->string('location')->nullable()->after('target_roles');
            $table->text('bio')->nullable()->after('location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role',
                'api_token',
                'company',
                'current_role',
                'target_roles',
                'location',
                'bio',
            ]);
        });
    }
};
