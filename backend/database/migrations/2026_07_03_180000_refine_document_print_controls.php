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
            $table->unsignedTinyInteger('max_official_devis')->default(2)->after('max_official_prints');
            $table->unsignedTinyInteger('max_official_invoices')->default(2)->after('max_official_devis');
            $table->unsignedTinyInteger('max_official_delivery_forms')->default(2)->after('max_official_invoices');
            $table->unsignedTinyInteger('max_official_contracts')->default(2)->after('max_official_delivery_forms');
        });

        DB::table('tenants')->orderBy('id')->get(['id', 'max_official_prints'])->each(function (object $tenant): void {
            $max = (int) ($tenant->max_official_prints ?? 2);

            DB::table('tenants')->where('id', $tenant->id)->update([
                'max_official_devis' => $max,
                'max_official_invoices' => $max,
                'max_official_delivery_forms' => $max,
                'max_official_contracts' => $max,
            ]);
        });

        Schema::table('quotes', function (Blueprint $table): void {
            $table->renameColumn('print_count', 'generation_count');
        });

        Schema::table('invoices', function (Blueprint $table): void {
            $table->renameColumn('print_count', 'generation_count');
        });

        Schema::table('delivery_forms', function (Blueprint $table): void {
            $table->renameColumn('print_count', 'generation_count');
        });

        Schema::table('contracts', function (Blueprint $table): void {
            $table->renameColumn('print_count', 'generation_count');
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table): void {
            $table->renameColumn('generation_count', 'print_count');
        });

        Schema::table('delivery_forms', function (Blueprint $table): void {
            $table->renameColumn('generation_count', 'print_count');
        });

        Schema::table('invoices', function (Blueprint $table): void {
            $table->renameColumn('generation_count', 'print_count');
        });

        Schema::table('quotes', function (Blueprint $table): void {
            $table->renameColumn('generation_count', 'print_count');
        });

        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn([
                'max_official_devis',
                'max_official_invoices',
                'max_official_delivery_forms',
                'max_official_contracts',
            ]);
        });
    }
};
