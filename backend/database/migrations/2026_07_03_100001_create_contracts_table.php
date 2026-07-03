<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->foreignId('contract_template_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title', 255);
            $table->longText('content');
            $table->string('status', 30)->default('draft');
            $table->timestamp('client_signed_at')->nullable();
            $table->timestamp('tenant_signed_at')->nullable();
            $table->longText('client_signature_data')->nullable();
            $table->longText('tenant_signature_data')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'status']);
            $table->index(['client_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
