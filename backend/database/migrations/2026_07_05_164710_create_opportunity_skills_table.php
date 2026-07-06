<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunity_skills', function (Blueprint $table) {
            $table->id();

            $table->foreignId('opportunity_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('skill');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_skills');
    }
};