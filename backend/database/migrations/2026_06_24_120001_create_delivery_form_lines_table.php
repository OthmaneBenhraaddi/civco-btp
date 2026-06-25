<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_form_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_form_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quote_line_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_phase_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('description', 500);
            $table->decimal('quantity', 12, 3)->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_form_lines');
    }
};
