<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('recruiter_applications')) {
            Schema::table('recruiter_applications', function (Blueprint $table) {
                if (! Schema::hasColumn('recruiter_applications', 'reject_reason')) {
                    $table->text('reject_reason')->nullable()->after('recruiter_notes');
                }
                if (! Schema::hasColumn('recruiter_applications', 'info_request')) {
                    $table->text('info_request')->nullable()->after('reject_reason');
                }
                if (! Schema::hasColumn('recruiter_applications', 'hired_at')) {
                    $table->timestamp('hired_at')->nullable()->after('interview_link');
                }
                if (! Schema::hasColumn('recruiter_applications', 'completed_at')) {
                    $table->timestamp('completed_at')->nullable()->after('hired_at');
                }
            });
        }

        if (! Schema::hasTable('recruiter_application_events')) {
            Schema::create('recruiter_application_events', function (Blueprint $table) {
                $table->id();
                $table->foreignId('recruiter_application_id')
                    ->constrained('recruiter_applications')
                    ->cascadeOnDelete();
                $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('event', 60);
                $table->string('from_status', 40)->nullable();
                $table->string('to_status', 40)->nullable();
                $table->text('note')->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();

                $table->index(['recruiter_application_id', 'created_at'], 'recruiter_app_events_app_created_idx');
            });
        }

        if (! Schema::hasTable('recruiter_messages')) {
            Schema::create('recruiter_messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('recruiter_application_id')
                    ->constrained('recruiter_applications')
                    ->cascadeOnDelete();
                $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
                $table->text('body');
                $table->string('attachment_path')->nullable();
                $table->string('attachment_name')->nullable();
                $table->string('attachment_mime')->nullable();
                $table->boolean('is_read')->default(false);
                $table->timestamp('read_at')->nullable();
                $table->timestamps();

                $table->index(['recruiter_application_id', 'created_at'], 'recruiter_messages_app_created_idx');
                $table->index(['receiver_id', 'is_read']);
            });
        }

        if (Schema::hasTable('recruiter_contact_unlocks')) {
            try {
                Schema::table('recruiter_contact_unlocks', function (Blueprint $table) {
                    $table->unique(
                        ['recruiter_id', 'recruiter_application_id'],
                        'recruiter_unlocks_recruiter_app_unique'
                    );
                });
            } catch (\Throwable) {
                // Index may already exist on re-run.
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('recruiter_messages');
        Schema::dropIfExists('recruiter_application_events');

        if (Schema::hasTable('recruiter_applications')) {
            Schema::table('recruiter_applications', function (Blueprint $table) {
                foreach (['reject_reason', 'info_request', 'hired_at', 'completed_at'] as $column) {
                    if (Schema::hasColumn('recruiter_applications', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
