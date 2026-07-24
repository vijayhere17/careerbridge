<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('company_name');
            $table->string('designation')->nullable();
            $table->string('department')->nullable();
            $table->string('company_logo')->nullable();
            $table->string('company_website')->nullable();
            $table->string('industry')->nullable();
            $table->string('company_size')->nullable();
            $table->text('company_description')->nullable();
            $table->string('office_location')->nullable();
            $table->string('phone')->nullable();
            $table->string('linkedin')->nullable();
            $table->boolean('verified')->default(false);
            $table->enum('status', ['active', 'inactive', 'pending'])->default('active');
            $table->timestamps();

            $table->unique('user_id');
            $table->index('status');
            $table->index('industry');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_profiles');
    }
};
