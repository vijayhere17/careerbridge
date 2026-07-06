<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mentor_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mentor_id')->constrained('mentor_profiles')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('price')->default(0);
            $table->unsignedInteger('duration')->default(60);
            $table->string('session_type')->default('Video Call');
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentor_services');
    }
};
