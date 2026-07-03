<?php

namespace App\Services;

use App\Models\DispatchNote;

class DispatchNoteReferenceService
{
    public function nextForCompany(int $companyId): string
    {
        $year = now()->format('Y');

        $latest = DispatchNote::query()
            ->where('company_id', $companyId)
            ->where('reference_number', 'like', "BR-{$year}-%")
            ->orderByDesc('reference_number')
            ->value('reference_number');

        $sequence = 1;

        if (is_string($latest) && preg_match('/BR-\d{4}-(\d+)$/', $latest, $matches) === 1) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('BR-%s-%04d', $year, $sequence);
    }
}
