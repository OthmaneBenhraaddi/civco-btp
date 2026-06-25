<?php

namespace App\Services;

use App\Models\ThemeColor;
use Illuminate\Support\Facades\DB;

class ThemeColorService
{
    /** @var array<string, string> */
    public const DEFAULTS = [
        'primary_color' => '#2563EB',
        'success_status' => '#4ADE80',
        'info_status' => '#60A5FA',
        'progress_status' => '#38BDF8',
        'warning_status' => '#FACC15',
        'danger_status' => '#F87171',
        'neutral_status' => '#94A3B8',
        'accent_status' => '#34D399',
        'violet_status' => '#A78BFA',
        'role_purple' => '#C4B5FD',
        'role_sky' => '#7DD3FC',
        'role_amber' => '#FCD34D',
        'role_emerald' => '#6EE7B7',
        'role_slate' => '#CBD5E1',
        'chart_revenue' => '#6366F1',
        'chart_activity' => '#14B8A6',
        'chart_in_progress' => '#14B8A6',
        'chart_completed' => '#8B5CF6',
        'chart_palette_1' => '#6366F1',
        'chart_palette_2' => '#14B8A6',
        'chart_palette_3' => '#3B82F6',
        'chart_palette_4' => '#F59E0B',
        'chart_palette_5' => '#8B5CF6',
        'chart_palette_6' => '#EC4899',
        'chart_palette_7' => '#64748B',
    ];

    public function allForCompany(int $companyId): array
    {
        $stored = ThemeColor::query()
            ->forCompany($companyId)
            ->pluck('value', 'key')
            ->all();

        return array_merge(self::DEFAULTS, $stored);
    }

  /**
     * @param  array<string, string>  $colors
     * @return array<string, string>
     */
    public function updateForCompany(int $companyId, array $colors): array
    {
        $allowedKeys = array_keys(self::DEFAULTS);

        DB::transaction(function () use ($companyId, $colors, $allowedKeys): void {
            foreach ($colors as $key => $value) {
                if (! in_array($key, $allowedKeys, true)) {
                    continue;
                }

                ThemeColor::query()->updateOrCreate(
                    [
                        'company_id' => $companyId,
                        'key' => $key,
                    ],
                    [
                        'value' => strtoupper($value),
                    ],
                );
            }
        });

        return $this->allForCompany($companyId);
    }

    public function seedDefaultsForCompany(int $companyId): void
    {
        foreach (self::DEFAULTS as $key => $value) {
            ThemeColor::query()->firstOrCreate(
                [
                    'company_id' => $companyId,
                    'key' => $key,
                ],
                [
                    'value' => $value,
                ],
            );
        }
    }
}
