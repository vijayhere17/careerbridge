<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mentor_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mentor_id')->constrained('mentor_profiles')->cascadeOnDelete();
            $table->foreignId('candidate_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('service_id')->nullable()->constrained('mentor_services')->nullOnDelete();
            $table->date('date');
            $table->string('time');
            $table->text('requirements')->nullable();
            $table->unsignedInteger('amount')->default(0);
            $table->string('status')->default('pending');
            $table->string('payment_status')->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentor_bookings');
    }
};
