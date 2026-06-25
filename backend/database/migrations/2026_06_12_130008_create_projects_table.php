<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->string('reference', 50);
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->string('status', 30)->default('draft');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->date('actual_start_date')->nullable();
            $table->date('actual_end_date')->nullable();
            $table->decimal('budget', 15, 2)->nullable();
            $table->decimal('progress_percent', 5, 2)->default(0);
            $table->string('site_address_line1', 255)->nullable();
            $table->string('site_city', 100)->nullable();
            $table->string('site_postal_code', 20)->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'reference']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
