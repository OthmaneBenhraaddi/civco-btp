<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table): void {
            if (! Schema::hasColumn('tickets', 'is_cms_ticket')) {
                $table->boolean('is_cms_ticket')->default(false)->after('client_id');
            }

            if (! Schema::hasColumn('tickets', 'target_admin_id')) {
                $table->foreignId('target_admin_id')
                    ->nullable()
                    ->after('created_by_user_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });

        $this->makeClientIdNullable();

        Schema::table('ticket_messages', function (Blueprint $table): void {
            if (! Schema::hasColumn('ticket_messages', 'sender_role')) {
                $table->string('sender_role', 32)->nullable()->after('sender_id');
            }
        });

        Schema::table('tickets', function (Blueprint $table): void {
            $table->index(['tenant_id', 'is_cms_ticket', 'target_admin_id'], 'tickets_cms_visibility_index');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table): void {
            $table->dropIndex('tickets_cms_visibility_index');
        });

        Schema::table('ticket_messages', function (Blueprint $table): void {
            if (Schema::hasColumn('ticket_messages', 'sender_role')) {
                $table->dropColumn('sender_role');
            }
        });

        Schema::table('tickets', function (Blueprint $table): void {
            if (Schema::hasColumn('tickets', 'target_admin_id')) {
                $table->dropConstrainedForeignId('target_admin_id');
            }

            if (Schema::hasColumn('tickets', 'is_cms_ticket')) {
                $table->dropColumn('is_cms_ticket');
            }
        });
    }

    private function makeClientIdNullable(): void
    {
        if (! Schema::hasColumn('tickets', 'client_id')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            Schema::table('tickets', function (Blueprint $table): void {
                $table->foreignId('client_id')->nullable()->change();
            });

            return;
        }

        Schema::table('tickets', function (Blueprint $table): void {
            $table->dropForeign(['client_id']);
        });

        DB::statement('ALTER TABLE tickets MODIFY client_id BIGINT UNSIGNED NULL');

        Schema::table('tickets', function (Blueprint $table): void {
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });
    }
};
