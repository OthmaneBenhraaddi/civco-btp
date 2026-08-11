<?php

namespace App\Models\Concerns;

use App\Support\StealthModeManager;
use Illuminate\Database\Eloquent\Builder;

trait AppliesStealthViaProjectPhase
{
    public static function bootAppliesStealthViaProjectPhase(): void
    {
        static::addGlobalScope('stealth_official', function (Builder $builder): void {
            if (! StealthModeManager::shouldHideUnofficial()) {
                return;
            }

            $table = $builder->getModel()->getTable();

            $builder->whereExists(function ($sub) use ($table): void {
                $sub->selectRaw('1')
                    ->from('project_phases')
                    ->join('projects', 'projects.id', '=', 'project_phases.project_id')
                    ->join('clients', 'clients.id', '=', 'projects.client_id')
                    ->whereColumn('project_phases.id', $table.'.project_phase_id')
                    ->where('clients.is_official', true);
            });
        });
    }

    public function scopeWithoutStealthScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('stealth_official');
    }
}
