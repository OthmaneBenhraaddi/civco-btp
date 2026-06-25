<?php

use App\Models\Company;
use App\Models\Lot;
use App\Models\Sector;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('lots', 'sector_id')) {
            Schema::table('lots', function (Blueprint $table): void {
                $table->foreignId('sector_id')->nullable()->after('name');
            });
        }

        if (Schema::hasColumn('lots', 'sector')) {
            Company::query()->each(function (Company $company): void {
                $sectorNames = Lot::query()
                    ->where('company_id', $company->id)
                    ->distinct()
                    ->pluck('sector')
                    ->filter()
                    ->all();

                if ($sectorNames === []) {
                    $sectorNames = ['VRD', 'BÂTIMENT'];
                }

                foreach ($sectorNames as $name) {
                    $sector = Sector::query()->firstOrCreate(
                        ['company_id' => $company->id, 'name' => $name],
                    );

                    Lot::query()
                        ->where('company_id', $company->id)
                        ->where('sector', $name)
                        ->whereNull('sector_id')
                        ->update(['sector_id' => $sector->id]);
                }
            });

            Schema::table('lots', function (Blueprint $table): void {
                $table->dropColumn('sector');
            });
        }

        DB::table('lots')->whereNull('sector_id')->delete();

        $hasSectorForeignKey = collect(DB::select(
            "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'lots'
               AND CONSTRAINT_TYPE = 'FOREIGN KEY'
               AND CONSTRAINT_NAME LIKE '%sector_id%'",
        ))->isNotEmpty();

        if ($hasSectorForeignKey) {
            Schema::table('lots', function (Blueprint $table): void {
                $table->dropForeign(['sector_id']);
            });
        }

        Schema::table('lots', function (Blueprint $table): void {
            $table->unsignedBigInteger('sector_id')->nullable(false)->change();
            $table->foreign('sector_id')->references('id')->on('sectors')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lots', function (Blueprint $table): void {
            $table->dropForeign(['sector_id']);
            $table->string('sector', 20)->nullable()->after('name');
        });

        Lot::query()->with('sector')->each(function (Lot $lot): void {
            if ($lot->sector) {
                $lot->update(['sector' => $lot->sector->name]);
            }
        });

        Schema::table('lots', function (Blueprint $table): void {
            $table->dropColumn('sector_id');
            $table->string('sector', 20)->nullable(false)->change();
        });
    }
};
