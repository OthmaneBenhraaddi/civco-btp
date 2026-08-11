<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            if (! Schema::hasColumn('tenants', 'max_official_prints')) {
                $table->unsignedTinyInteger('max_official_prints')->default(2)->after('status');
            }
        });

        Schema::table('tenants', function (Blueprint $table): void {
            if (! Schema::hasColumn('tenants', 'max_official_devis')) {
                $table->unsignedTinyInteger('max_official_devis')->default(2)->after('max_official_prints');
            }
            if (! Schema::hasColumn('tenants', 'max_official_invoices')) {
                $table->unsignedTinyInteger('max_official_invoices')->default(2)->after('max_official_devis');
            }
            if (! Schema::hasColumn('tenants', 'max_official_delivery_forms')) {
                $table->unsignedTinyInteger('max_official_delivery_forms')->default(2)->after('max_official_invoices');
            }
            if (! Schema::hasColumn('tenants', 'max_official_contracts')) {
                $table->unsignedTinyInteger('max_official_contracts')->default(2)->after('max_official_delivery_forms');
            }
        });

        if (Schema::hasColumn('tenants', 'max_official_prints')) {
            DB::table('tenants')->orderBy('id')->get(['id', 'max_official_prints'])->each(function (object $tenant): void {
                $max = (int) ($tenant->max_official_prints ?? 2);

                DB::table('tenants')->where('id', $tenant->id)->update([
                    'max_official_devis' => $max,
                    'max_official_invoices' => $max,
                    'max_official_delivery_forms' => $max,
                    'max_official_contracts' => $max,
                ]);
            });
        }

        foreach (['quotes', 'invoices', 'delivery_forms', 'contracts'] as $tableName) {
            if (
                Schema::hasColumn($tableName, 'print_count')
                && ! Schema::hasColumn($tableName, 'generation_count')
            ) {
                Schema::table($tableName, function (Blueprint $table): void {
                    $table->renameColumn('print_count', 'generation_count');
                });
            }
        }
    }

    public function down(): void
    {
        foreach (['contracts', 'delivery_forms', 'invoices', 'quotes'] as $tableName) {
            if (
                Schema::hasColumn($tableName, 'generation_count')
                && ! Schema::hasColumn($tableName, 'print_count')
            ) {
                Schema::table($tableName, function (Blueprint $table): void {
                    $table->renameColumn('generation_count', 'print_count');
                });
            }
        }

        Schema::table('tenants', function (Blueprint $table): void {
            $columns = array_filter([
                Schema::hasColumn('tenants', 'max_official_devis') ? 'max_official_devis' : null,
                Schema::hasColumn('tenants', 'max_official_invoices') ? 'max_official_invoices' : null,
                Schema::hasColumn('tenants', 'max_official_delivery_forms') ? 'max_official_delivery_forms' : null,
                Schema::hasColumn('tenants', 'max_official_contracts') ? 'max_official_contracts' : null,
            ]);

            if ($columns !== []) {
                $table->dropColumn(array_values($columns));
            }
        });
    }
};
