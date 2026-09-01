<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('homepage_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('hero_title', 255);
            $table->string('hero_highlight', 150)->nullable();
            $table->text('hero_description')->nullable();
            $table->string('hero_background_path')->nullable();
            $table->timestamps();
        });

        Schema::create('homepage_partners', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 150);
            $table->string('logo_path');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('homepage_cards', function (Blueprint $table): void {
            $table->id();
            $table->string('slug', 40)->unique();
            $table->string('title', 180);
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->string('fallback_image_url')->nullable();
            $table->boolean('tall')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('homepage_cards');
        Schema::dropIfExists('homepage_partners');
        Schema::dropIfExists('homepage_settings');
    }
};
