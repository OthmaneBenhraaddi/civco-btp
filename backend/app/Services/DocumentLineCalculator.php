<?php

namespace App\Services;

class DocumentLineCalculator
{
    public static function lineTotals(float $quantity, float $unitPriceHt, float $taxRate): array
    {
        $lineTotalHt = round($quantity * $unitPriceHt, 2);
        $lineTotalTax = round($lineTotalHt * ($taxRate / 100), 2);
        $lineTotalTtc = round($lineTotalHt + $lineTotalTax, 2);

        return [
            'line_total_ht' => $lineTotalHt,
            'line_total_tax' => $lineTotalTax,
            'line_total_ttc' => $lineTotalTtc,
        ];
    }
}
