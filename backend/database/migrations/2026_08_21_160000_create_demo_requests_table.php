<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demo_requests', function (Blueprint $table): void {
            $table->id();
            $table->string('full_name', 150);
            $table->string('company_name', 150);
            $table->string('email', 191);
            $table->string('phone', 40)->nullable();
            $table->text('message')->nullable();
            $table->string('status', 32)->default('pending')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demo_requests');
    }
};
