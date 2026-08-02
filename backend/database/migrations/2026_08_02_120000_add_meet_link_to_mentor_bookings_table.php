<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('mentor_bookings', 'meet_link')) {
            Schema::table('mentor_bookings', function (Blueprint $table) {
                $table->string('meet_link')->nullable()->after('payment_status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('mentor_bookings', 'meet_link')) {
            Schema::table('mentor_bookings', function (Blueprint $table) {
                $table->dropColumn('meet_link');
            });
        }
    }
};
