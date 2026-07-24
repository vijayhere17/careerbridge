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
    Schema::create('mentor_bank_details', function (Blueprint $table) {

        $table->id();

        $table->foreignId('mentor_id')
            ->constrained('mentor_profiles')
            ->cascadeOnDelete();

        $table->string('account_holder');

        $table->string('bank_name');

        $table->string('account_number');

        $table->string('ifsc_code');

        $table->string('upi_id')->nullable();

        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mentor_bank_details');
    }
};
