<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mentors', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('initials', 8);
            $table->string('avatar_color')->nullable();
            $table->string('role');
            $table->string('company');
            $table->string('company_slug');
            $table->unsignedTinyInteger('experience')->default(0);
            $table->string('location');
            $table->json('languages')->nullable();
            $table->text('bio');
            $table->json('skills')->nullable();
            $table->decimal('rating', 3, 2)->default(0);
            $table->unsignedInteger('reviews')->default(0);
            $table->unsignedInteger('sessions')->default(0);
            $table->unsignedInteger('price_per_session')->default(0);
            $table->string('response_time')->nullable();
            $table->boolean('available')->default(false);
            $table->json('services')->nullable();
            $table->json('journey')->nullable();
            $table->json('achievements')->nullable();
            $table->json('certifications')->nullable();
            $table->json('testimonials')->nullable();
            $table->json('faqs')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentors');
    }
};
