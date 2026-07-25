<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('recruiter_profiles')) {
            Schema::table('recruiter_profiles', function (Blueprint $table) {
                if (! Schema::hasColumn('recruiter_profiles', 'cover_image')) {
                    $table->string('cover_image')->nullable()->after('company_logo');
                }
            });
        }

        if (Schema::hasTable('withdraw_requests')) {
            Schema::table('withdraw_requests', function (Blueprint $table) {
                if (! Schema::hasColumn('withdraw_requests', 'account_holder')) {
                    $table->string('account_holder')->nullable()->after('bank_name');
                }
                if (! Schema::hasColumn('withdraw_requests', 'ifsc')) {
                    $table->string('ifsc', 20)->nullable()->after('account_number');
                }
                if (! Schema::hasColumn('withdraw_requests', 'upi')) {
                    $table->string('upi')->nullable()->after('ifsc');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('recruiter_profiles') && Schema::hasColumn('recruiter_profiles', 'cover_image')) {
            Schema::table('recruiter_profiles', function (Blueprint $table) {
                $table->dropColumn('cover_image');
            });
        }

        if (Schema::hasTable('withdraw_requests')) {
            Schema::table('withdraw_requests', function (Blueprint $table) {
                $columns = array_values(array_filter([
                    Schema::hasColumn('withdraw_requests', 'account_holder') ? 'account_holder' : null,
                    Schema::hasColumn('withdraw_requests', 'ifsc') ? 'ifsc' : null,
                    Schema::hasColumn('withdraw_requests', 'upi') ? 'upi' : null,
                ]));

                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
