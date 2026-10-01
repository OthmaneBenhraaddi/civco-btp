<?php

namespace App\Models\Concerns;

use App\Models\Client;
use App\Support\StealthModeManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

trait AppliesStealthClientFilter
{
    /** @var array<string, bool> */
    private static array $stealthProjectColumnCache = [];

    public static function bootAppliesStealthClientFilter(): void
    {
        static::addGlobalScope('stealth_official', function (Builder $builder): void {
            if (! StealthModeManager::shouldHideUnofficial()) {
                return;
            }

            $model = $builder->getModel();
            $table = $model->getTable();

            if ($model instanceof Client) {
                // Hide confidential clients unless they own at least one public project.
                $builder->where(function (Builder $query) use ($table): void {
                    $query->where($table.'.is_official', true)
                        ->orWhereExists(function ($sub) use ($table): void {
                            $sub->selectRaw('1')
                                ->from('projects')
                                ->whereColumn('projects.client_id', $table.'.id')
                                ->where('projects.is_official', true);
                        });
                });

                return;
            }

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

            if (! self::tableHasProjectId($table)) {
                return;
            }

            $builder->where(function (Builder $query) use ($table): void {
                $query
                    ->whereNull($table.'.project_id')
                    ->orWhereExists(function ($sub) use ($table): void {
                        $sub->selectRaw('1')
                            ->from('projects')
                            ->whereColumn('projects.id', $table.'.project_id')
                            ->where('projects.is_official', true);
                    });
            });
        });
    }

    public function scopeWithoutStealthScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('stealth_official');
    }

    private static function tableHasProjectId(string $table): bool
    {
        if (! array_key_exists($table, self::$stealthProjectColumnCache)) {
            self::$stealthProjectColumnCache[$table] = Schema::hasColumn($table, 'project_id');
        }

        return self::$stealthProjectColumnCache[$table];
    }
}
