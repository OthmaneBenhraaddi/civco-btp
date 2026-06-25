<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            if (! Schema::hasColumn('projects', 'site_address')) {
                $table->string('site_address', 500)->nullable()->after('site_postal_code');
            }

            $table->decimal('latitude', 10, 7)->nullable()->after('site_address');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->dropColumn(['latitude', 'longitude']);

            if (Schema::hasColumn('projects', 'site_address')) {
                $table->dropColumn('site_address');
            }
        });
    }
};
