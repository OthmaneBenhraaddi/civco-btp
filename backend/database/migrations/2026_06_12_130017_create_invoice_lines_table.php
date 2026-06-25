<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('description', 500);
            $table->decimal('quantity', 12, 3)->default(1);
            $table->decimal('unit_price_ht', 15, 2);
            $table->decimal('tax_rate', 5, 2)->default(20);
            $table->decimal('line_total_ht', 15, 2)->default(0);
            $table->decimal('line_total_tax', 15, 2)->default(0);
            $table->decimal('line_total_ttc', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_lines');
    }
};
