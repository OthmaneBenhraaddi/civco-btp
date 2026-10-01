<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            if (! Schema::hasColumn('projects', 'is_official')) {
                $table->boolean('is_official')->default(true)->after('client_id');
            }
        });

        // Existing work for a confidential client stays confidential until a project is marked public.
        if (Schema::hasColumn('projects', 'is_official') && Schema::hasColumn('clients', 'is_official')) {
            DB::table('projects')
                ->whereIn('client_id', function ($query): void {
                    $query->select('id')->from('clients')->where('is_official', false);
                })
                ->update(['is_official' => false]);
        }
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            if (Schema::hasColumn('projects', 'is_official')) {
                $table->dropColumn('is_official');
            }
        });
    }
};
