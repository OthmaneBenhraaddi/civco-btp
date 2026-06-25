<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var array<int, array{legacy: string, name: string, sort_order: int}> */
    private const DEFAULT_TYPES = [
        ['legacy' => 'plan', 'name' => 'Plan', 'sort_order' => 10],
        ['legacy' => 'contract', 'name' => 'Contrat', 'sort_order' => 20],
        ['legacy' => 'photo', 'name' => 'Photo', 'sort_order' => 30],
        ['legacy' => 'report', 'name' => 'Rapport', 'sort_order' => 40],
        ['legacy' => 'other', 'name' => 'Autre', 'sort_order' => 50],
    ];

    public function up(): void
    {
        if (! Schema::hasTable('document_types')) {
            Schema::create('document_types', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('company_id')->constrained()->cascadeOnDelete();
                $table->string('name', 100);
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['company_id', 'name']);
            });
        }

        Schema::table('documents', function (Blueprint $table): void {
            if (! Schema::hasColumn('documents', 'document_type_id')) {
                $table->foreignId('document_type_id')
                    ->nullable()
                    ->after('file_size')
                    ->constrained('document_types')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('documents', 'category_label')) {
                $table->string('category_label', 100)->nullable()->after('document_type_id');
            }
        });

        $this->migrateLegacyCategories();

        if (Schema::hasColumn('documents', 'category')) {
            Schema::table('documents', function (Blueprint $table): void {
                $table->dropColumn('category');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('documents', 'category_label')) {
            Schema::table('documents', function (Blueprint $table): void {
                $table->dropColumn('category_label');
            });
        }

        if (Schema::hasColumn('documents', 'document_type_id')) {
            Schema::table('documents', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('document_type_id');
            });
        }

        Schema::dropIfExists('document_types');

        if (! Schema::hasColumn('documents', 'category')) {
            Schema::table('documents', function (Blueprint $table): void {
                $table->string('category', 50)->nullable()->after('file_size');
            });
        }
    }

    private function migrateLegacyCategories(): void
    {
        if (! Schema::hasTable('companies') || ! Schema::hasColumn('documents', 'category')) {
            $this->seedDefaultTypesForAllCompanies();

            return;
        }

        $companies = DB::table('companies')->pluck('id');

        foreach ($companies as $companyId) {
            $typeMap = $this->ensureDefaultTypes((int) $companyId);

            $documents = DB::table('documents')
                ->where('company_id', $companyId)
                ->whereNotNull('category')
                ->get(['id', 'category']);

            foreach ($documents as $document) {
                $legacy = (string) $document->category;
                $typeId = $typeMap[$legacy] ?? $typeMap['other'] ?? null;
                $label = collect(self::DEFAULT_TYPES)->firstWhere('legacy', $legacy)['name'] ?? ucfirst($legacy);

                DB::table('documents')->where('id', $document->id)->update([
                    'document_type_id' => $typeId,
                    'category_label' => $typeId === null ? $label : null,
                ]);
            }
        }

        $this->seedDefaultTypesForAllCompanies();
    }

    private function seedDefaultTypesForAllCompanies(): void
    {
        if (! Schema::hasTable('companies')) {
            return;
        }

        foreach (DB::table('companies')->pluck('id') as $companyId) {
            $this->ensureDefaultTypes((int) $companyId);
        }
    }

    /**
     * @return array<string, int>
     */
    private function ensureDefaultTypes(int $companyId): array
    {
        $map = [];

        foreach (self::DEFAULT_TYPES as $definition) {
            $existing = DB::table('document_types')
                ->where('company_id', $companyId)
                ->where('name', $definition['name'])
                ->first();

            if ($existing) {
                $map[$definition['legacy']] = (int) $existing->id;

                continue;
            }

            $id = DB::table('document_types')->insertGetId([
                'company_id' => $companyId,
                'name' => $definition['name'],
                'sort_order' => $definition['sort_order'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $map[$definition['legacy']] = $id;
        }

        return $map;
    }
};
