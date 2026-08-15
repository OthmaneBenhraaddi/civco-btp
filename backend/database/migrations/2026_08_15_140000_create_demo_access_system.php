<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->boolean('is_demo')->default(false)->after('status');
            $table->timestamp('demo_expires_at')->nullable()->after('is_demo');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('is_demo')->default(false)->after('status');
            $table->timestamp('demo_expires_at')->nullable()->after('is_demo');
        });

        Schema::create('demo_access_codes', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 32)->unique();
            $table->unsignedInteger('duration_hours');
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_used')->default(false);
            $table->timestamp('used_at')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('used_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('demo_tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->timestamps();

            $table->index(['is_used', 'created_at']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demo_access_codes');

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['is_demo', 'demo_expires_at']);
        });

        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn(['is_demo', 'demo_expires_at']);
        });
    }
};
