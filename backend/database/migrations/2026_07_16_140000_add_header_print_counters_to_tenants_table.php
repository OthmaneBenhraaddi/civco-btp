<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->unsignedInteger('official_docs_with_header_count')->default(0)->after('max_official_contracts');
            $table->unsignedInteger('official_docs_without_header_count')->default(0)->after('official_docs_with_header_count');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn([
                'official_docs_with_header_count',
                'official_docs_without_header_count',
            ]);
        });
    }
};
