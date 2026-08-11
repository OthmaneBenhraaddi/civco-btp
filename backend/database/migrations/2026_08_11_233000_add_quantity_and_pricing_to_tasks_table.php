<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            if (! Schema::hasColumn('tasks', 'quantity')) {
                $table->decimal('quantity', 15, 3)->nullable()->after('description');
            }

            if (! Schema::hasColumn('tasks', 'unit')) {
                $table->string('unit', 20)->nullable()->after('quantity');
            }

            if (! Schema::hasColumn('tasks', 'unit_price')) {
                $table->decimal('unit_price', 15, 2)->nullable()->after('unit');
            }

            if (! Schema::hasColumn('tasks', 'planned_start_date')) {
                $table->date('planned_start_date')->nullable()->after('progress_percent');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            foreach (['quantity', 'unit', 'unit_price', 'planned_start_date'] as $column) {
                if (Schema::hasColumn('tasks', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
