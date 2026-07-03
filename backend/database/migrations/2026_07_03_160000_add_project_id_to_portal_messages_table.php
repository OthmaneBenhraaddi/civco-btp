<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('portal_messages', function (Blueprint $table): void {
            $table->foreignId('project_id')
                ->nullable()
                ->after('receiver_id')
                ->constrained()
                ->nullOnDelete();

            $table->index(['tenant_id', 'project_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('portal_messages', function (Blueprint $table): void {
            $table->dropForeign(['project_id']);
            $table->dropIndex(['tenant_id', 'project_id', 'created_at']);
            $table->dropColumn('project_id');
        });
    }
};
