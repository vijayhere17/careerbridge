<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {

            $table->string('duration')->nullable()->after('employment_type');

            $table->boolean('ppo_chance')->default(false)->after('duration');

        });
    }

    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {

            $table->dropColumn([
                'duration',
                'ppo_chance',
            ]);

        });
    }
};