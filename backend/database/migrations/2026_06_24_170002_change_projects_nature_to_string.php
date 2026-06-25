<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            Schema::table('projects', function (Blueprint $table): void {
                $table->string('nature', 100)->nullable()->change();
            });

            return;
        }

        DB::statement('ALTER TABLE projects MODIFY nature VARCHAR(100) NULL');
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE projects MODIFY nature ENUM('VRD', 'BÂTIMENT') NULL");
    }
};
