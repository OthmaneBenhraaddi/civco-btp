<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_user', function (Blueprint $table): void {
            if (! Schema::hasColumn('project_user', 'can_chat_with_client')) {
                $table->boolean('can_chat_with_client')->default(false)->after('assigned_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('project_user', function (Blueprint $table): void {
            if (Schema::hasColumn('project_user', 'can_chat_with_client')) {
                $table->dropColumn('can_chat_with_client');
            }
        });
    }
};
