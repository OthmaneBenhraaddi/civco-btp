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
            if (! Schema::hasColumn('tenants', 'max_official_devis_with_header')) {
                $table->unsignedTinyInteger('max_official_devis_with_header')->default(2)->after('max_official_contracts');
            }
            if (! Schema::hasColumn('tenants', 'max_official_devis_without_header')) {
                $table->unsignedTinyInteger('max_official_devis_without_header')->default(2)->after('max_official_devis_with_header');
            }
            if (! Schema::hasColumn('tenants', 'max_official_invoices_with_header')) {
                $table->unsignedTinyInteger('max_official_invoices_with_header')->default(2)->after('max_official_devis_without_header');
            }
            if (! Schema::hasColumn('tenants', 'max_official_invoices_without_header')) {
                $table->unsignedTinyInteger('max_official_invoices_without_header')->default(2)->after('max_official_invoices_with_header');
            }
            if (! Schema::hasColumn('tenants', 'max_official_delivery_forms_with_header')) {
                $table->unsignedTinyInteger('max_official_delivery_forms_with_header')->default(2)->after('max_official_invoices_without_header');
            }
            if (! Schema::hasColumn('tenants', 'max_official_delivery_forms_without_header')) {
                $table->unsignedTinyInteger('max_official_delivery_forms_without_header')->default(2)->after('max_official_delivery_forms_with_header');
            }
            if (! Schema::hasColumn('tenants', 'max_official_contracts_with_header')) {
                $table->unsignedTinyInteger('max_official_contracts_with_header')->default(2)->after('max_official_delivery_forms_without_header');
            }
            if (! Schema::hasColumn('tenants', 'max_official_contracts_without_header')) {
                $table->unsignedTinyInteger('max_official_contracts_without_header')->default(2)->after('max_official_contracts_with_header');
            }
        });

        DB::table('tenants')->orderBy('id')->get([
            'id',
            'max_official_devis',
            'max_official_invoices',
            'max_official_delivery_forms',
            'max_official_contracts',
            'max_official_prints',
        ])->each(function (object $tenant): void {
            $fallback = max(1, (int) ($tenant->max_official_prints ?? 2));

            DB::table('tenants')->where('id', $tenant->id)->update([
                'max_official_devis_with_header' => max(1, (int) ($tenant->max_official_devis ?? $fallback)),
                'max_official_devis_without_header' => max(1, (int) ($tenant->max_official_devis ?? $fallback)),
                'max_official_invoices_with_header' => max(1, (int) ($tenant->max_official_invoices ?? $fallback)),
                'max_official_invoices_without_header' => max(1, (int) ($tenant->max_official_invoices ?? $fallback)),
                'max_official_delivery_forms_with_header' => max(1, (int) ($tenant->max_official_delivery_forms ?? $fallback)),
                'max_official_delivery_forms_without_header' => max(1, (int) ($tenant->max_official_delivery_forms ?? $fallback)),
                'max_official_contracts_with_header' => max(1, (int) ($tenant->max_official_contracts ?? $fallback)),
                'max_official_contracts_without_header' => max(1, (int) ($tenant->max_official_contracts ?? $fallback)),
            ]);
        });

        foreach (['quotes', 'invoices', 'delivery_forms', 'contracts'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName): void {
                if (! Schema::hasColumn($tableName, 'prints_with_header_count')) {
                    $table->unsignedInteger('prints_with_header_count')->default(0)->after('generation_count');
                }
                if (! Schema::hasColumn($tableName, 'prints_without_header_count')) {
                    $table->unsignedInteger('prints_without_header_count')->default(0)->after('prints_with_header_count');
                }
            });
        }
    }

    public function down(): void
    {
        foreach (['quotes', 'invoices', 'delivery_forms', 'contracts'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName): void {
                $columns = array_values(array_filter([
                    Schema::hasColumn($tableName, 'prints_with_header_count') ? 'prints_with_header_count' : null,
                    Schema::hasColumn($tableName, 'prints_without_header_count') ? 'prints_without_header_count' : null,
                ]));

                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }

        Schema::table('tenants', function (Blueprint $table): void {
            $columns = array_values(array_filter([
                Schema::hasColumn('tenants', 'max_official_devis_with_header') ? 'max_official_devis_with_header' : null,
                Schema::hasColumn('tenants', 'max_official_devis_without_header') ? 'max_official_devis_without_header' : null,
                Schema::hasColumn('tenants', 'max_official_invoices_with_header') ? 'max_official_invoices_with_header' : null,
                Schema::hasColumn('tenants', 'max_official_invoices_without_header') ? 'max_official_invoices_without_header' : null,
                Schema::hasColumn('tenants', 'max_official_delivery_forms_with_header') ? 'max_official_delivery_forms_with_header' : null,
                Schema::hasColumn('tenants', 'max_official_delivery_forms_without_header') ? 'max_official_delivery_forms_without_header' : null,
                Schema::hasColumn('tenants', 'max_official_contracts_with_header') ? 'max_official_contracts_with_header' : null,
                Schema::hasColumn('tenants', 'max_official_contracts_without_header') ? 'max_official_contracts_without_header' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
