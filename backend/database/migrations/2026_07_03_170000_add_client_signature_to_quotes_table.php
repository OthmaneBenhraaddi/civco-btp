<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table): void {
            $table->longText('client_signature_data')->nullable()->after('notes');
            $table->timestamp('client_signed_at')->nullable()->after('client_signature_data');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table): void {
            $table->dropColumn(['client_signature_data', 'client_signed_at']);
        });
    }
};
