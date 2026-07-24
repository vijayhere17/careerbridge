<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hr_id')->constrained('users')->cascadeOnDelete();
            $table->string('action');
            $table->string('module');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['hr_id', 'created_at']);
            $table->index('module');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_activity_logs');
    }
};
