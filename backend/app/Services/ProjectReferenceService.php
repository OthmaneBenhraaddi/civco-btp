<?php

namespace App\Services;

use App\Models\Project;

class ProjectReferenceService
{
    public function nextForCompany(int $companyId): string
    {
        $year = now()->format('Y');
        $prefix = "PRJ-{$year}-";

        $latest = Project::query()
            ->where('company_id', $companyId)
            ->where('reference', 'like', "{$prefix}%")
            ->orderByDesc('reference')
            ->value('reference');

        $sequence = 1;

        if ($latest !== null && preg_match('/-(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return $prefix.str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);
    }
}
