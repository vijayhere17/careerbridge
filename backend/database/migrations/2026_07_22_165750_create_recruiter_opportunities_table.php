<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('recruiter_opportunities', function (Blueprint $table) {

    $table->id();

    $table->foreignId('user_id')->constrained()->cascadeOnDelete();

    $table->string('opportunity_type');      // job, internship, freelance, urgent

    $table->string('title');

    $table->string('company_name');

    $table->string('location')->nullable();

    $table->string('employment_type')->nullable();

    $table->string('experience_level')->nullable();

    $table->decimal('salary_min',10,2)->nullable();

    $table->decimal('salary_max',10,2)->nullable();

    $table->date('application_deadline')->nullable();

    $table->text('skills')->nullable();

    $table->longText('description')->nullable();

    $table->longText('responsibilities')->nullable();

    $table->longText('requirements')->nullable();

    $table->longText('benefits')->nullable();

    $table->enum('work_mode',['Remote','Hybrid','Office'])->default('Hybrid');

    $table->enum('contact_visibility',['public','locked'])->default('locked');

    $table->enum('status',[
        'draft',
        'published',
        'closed'
    ])->default('draft');

    $table->unsignedInteger('views')->default(0);

    $table->unsignedInteger('applications_count')->default(0);

    $table->timestamps();

});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recruiter_opportunities');
    }
};
