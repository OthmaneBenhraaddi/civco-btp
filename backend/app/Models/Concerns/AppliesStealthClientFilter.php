<?php

namespace App\Models\Concerns;

use App\Models\Client;
use App\Support\StealthModeManager;
use Illuminate\Database\Eloquent\Builder;

trait AppliesStealthClientFilter
{
    public static function bootAppliesStealthClientFilter(): void
    {
        static::addGlobalScope('stealth_official', function (Builder $builder): void {
            if (! StealthModeManager::shouldHideUnofficial()) {
                return;
            }

            $model = $builder->getModel();
            $table = $model->getTable();

            if ($model instanceof Client) {
                $builder->where($table.'.is_official', true);

                return;
            }

            // Hide rows linked to unofficial clients (projects, quotes, invoices, BL…).
            $builder->where(function (Builder $query) use ($table): void {
                $query
                    ->whereNull($table.'.client_id')
                    ->orWhereExists(function ($sub) use ($table): void {
                        $sub->selectRaw('1')
                            ->from('clients')
                            ->whereColumn('clients.id', $table.'.client_id')
                            ->where('clients.is_official', true);
                    });
            });
        });
    }

    public function scopeWithoutStealthScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('stealth_official');
    }
}
