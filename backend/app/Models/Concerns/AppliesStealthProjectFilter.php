<?php

namespace App\Models\Concerns;

use App\Support\StealthModeManager;
use Illuminate\Database\Eloquent\Builder;

trait AppliesStealthProjectFilter
{
    public static function bootAppliesStealthProjectFilter(): void
    {
        static::addGlobalScope('stealth_official', function (Builder $builder): void {
            if (! StealthModeManager::shouldHideUnofficial()) {
                return;
            }

            $table = $builder->getModel()->getTable();

            // Confidential projects are hidden unconditionally while stealth mode is on.
            $builder->where($table.'.is_official', true);
        });
    }

    public function scopeWithoutStealthScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('stealth_official');
    }
}
