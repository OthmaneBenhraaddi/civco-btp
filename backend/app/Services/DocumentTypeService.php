<?php

namespace App\Services;

use App\Models\DocumentType;
use Illuminate\Support\Facades\DB;

class DocumentTypeService
{
    /** @var array<int, array{legacy: string, name: string, sort_order: int}> */
    public const DEFAULT_TYPES = [
        ['legacy' => 'plan', 'name' => 'Plan', 'sort_order' => 10],
        ['legacy' => 'contract', 'name' => 'Contrat', 'sort_order' => 20],
        ['legacy' => 'photo', 'name' => 'Photo', 'sort_order' => 30],
        ['legacy' => 'report', 'name' => 'Rapport', 'sort_order' => 40],
        ['legacy' => 'other', 'name' => 'Autre', 'sort_order' => 50],
    ];

    public function ensureDefaultsForCompany(int $companyId): void
    {
        if (DocumentType::query()->forCompany($companyId)->exists()) {
            return;
        }

        DB::transaction(function () use ($companyId): void {
            foreach (self::DEFAULT_TYPES as $definition) {
                DocumentType::query()->create([
                    'company_id' => $companyId,
                    'name' => $definition['name'],
                    'sort_order' => $definition['sort_order'],
                    'is_active' => true,
                ]);
            }
        });
    }
}
