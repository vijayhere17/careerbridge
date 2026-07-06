<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_mentors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('mentor_id')->constrained('mentor_profiles')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['candidate_id', 'mentor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_mentors');
    }
};
