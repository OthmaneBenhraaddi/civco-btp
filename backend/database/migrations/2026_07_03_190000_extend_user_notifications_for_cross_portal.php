<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_notifications', function (Blueprint $table): void {
            $table->foreignId('tenant_id')
                ->nullable()
                ->after('user_id')
                ->constrained('tenants')
                ->nullOnDelete();
            $table->string('type', 50)->default('chat')->after('message');
            $table->string('action_path', 500)->nullable()->after('type');
            $table->timestamp('updated_at')->nullable()->after('created_at');

            $table->index(['user_id', 'read_at', 'created_at']);
            $table->index(['tenant_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::table('user_notifications', function (Blueprint $table): void {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['user_id', 'read_at', 'created_at']);
            $table->dropIndex(['tenant_id', 'type']);
            $table->dropColumn(['tenant_id', 'type', 'action_path', 'updated_at']);
        });
    }
};
