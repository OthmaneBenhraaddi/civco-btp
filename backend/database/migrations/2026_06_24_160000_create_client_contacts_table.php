<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_contacts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('email', 150)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('contact_role', 50)->default('commercial');
            $table->timestamps();

            $table->index(['client_id', 'contact_role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_contacts');
    }
};
