<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('mobile', 30)->nullable()->unique()->after('email');
        });

        Schema::create('auth_otps', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('purpose');
            $table->string('code');
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auth_otps');
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['mobile']);
            $table->dropColumn('mobile');
        });
    }
};
