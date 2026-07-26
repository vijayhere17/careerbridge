<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Legacy HR enhancement migration.
 * The HR module has been removed from CareerBridge; keep this file as a
 * SQLite-safe no-op so environments that never applied the original MySQL
 * ALTER statements can continue migrating.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'hr_preferences')) {
            Schema::table('users', function (Blueprint $table) {
                $table->json('hr_preferences')->nullable();
            });
        }
    }

    public function down(): void
    {
        //
    }
};
