<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunities', function (Blueprint $table) {
            $table->id();

            // Job Provider / HR
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Category
            $table->enum('category', [
                'jobs',
                'internships',
                'freelance',
                'recruiter',
                'hr'
            ]);

            // Company
            $table->string('company');
            $table->string('company_logo')->nullable();

            // Job
            $table->string('title');
            $table->string('role');

            $table->string('industry')->nullable();
            $table->string('domain')->nullable();

            $table->string('location');

            $table->enum('work_type', [
                'Remote',
                'Hybrid',
                'Onsite'
            ]);

            $table->string('experience');
            $table->string('salary');

            $table->string('employment_type');

            $table->longText('description');

            $table->longText('interview_process')->nullable();

            // Contact
            $table->string('provider_name');

            $table->enum('provider_type', [
                'Company HR',
                'Recruiter',
                'Founder',
                'Hiring Manager',
                'Startup Owner',
                'Mentor',
                'Freelance Client'
            ]);

            $table->boolean('provider_verified')->default(false);

            $table->integer('contact_price')->default(0);

            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('linkedin')->nullable();
            $table->string('apply_url')->nullable();

            // Job Status
            $table->boolean('verified')->default(false);
            $table->boolean('featured')->default(false);
            $table->boolean('active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunities');
    }
};