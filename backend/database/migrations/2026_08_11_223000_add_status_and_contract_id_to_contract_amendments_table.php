<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $addedStatus = ! Schema::hasColumn('contract_amendments', 'status');

        Schema::table('contract_amendments', function (Blueprint $table): void {
            if (! Schema::hasColumn('contract_amendments', 'contract_id')) {
                $table->foreignId('contract_id')
                    ->nullable()
                    ->after('project_id')
                    ->constrained('contracts')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('contract_amendments', 'status')) {
                $table->string('status', 32)->default('draft')->after('type');
            }

            if (! Schema::hasColumn('contract_amendments', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable()->after('created_by_user_id');
            }

            if (! Schema::hasColumn('contract_amendments', 'validated_at')) {
                $table->timestamp('validated_at')->nullable()->after('submitted_at');
            }

            if (! Schema::hasColumn('contract_amendments', 'refused_at')) {
                $table->timestamp('refused_at')->nullable()->after('validated_at');
            }
        });

        if ($addedStatus) {
            DB::table('contract_amendments')->update([
                'status' => 'validated',
                'validated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('contract_amendments', function (Blueprint $table): void {
            if (Schema::hasColumn('contract_amendments', 'contract_id')) {
                $table->dropConstrainedForeignId('contract_id');
            }

            foreach (['submitted_at', 'validated_at', 'refused_at', 'status'] as $column) {
                if (Schema::hasColumn('contract_amendments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
