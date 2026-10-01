<?php

namespace App\Models\Concerns;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\Quote;
use App\Support\StealthModeManager;
use Illuminate\Database\Eloquent\Builder;

trait AppliesStealthDocumentFilter
{
    public static function bootAppliesStealthDocumentFilter(): void
    {
        static::addGlobalScope('stealth_official', function (Builder $builder): void {
            if (! StealthModeManager::shouldHideUnofficial()) {
                return;
            }

            $projectType = (new Project)->getMorphClass();
            $clientType = (new Client)->getMorphClass();
            $quoteType = (new Quote)->getMorphClass();
            $invoiceType = (new Invoice)->getMorphClass();

            $builder->where(function (Builder $query) use ($projectType, $clientType, $quoteType, $invoiceType): void {
                $query->whereNotIn('documents.documentable_type', [
                    $projectType,
                    $clientType,
                    $quoteType,
                    $invoiceType,
                ])->orWhere(function (Builder $projectDocs) use ($projectType): void {
                    $projectDocs->where('documents.documentable_type', $projectType)
                        ->whereExists(function ($sub): void {
                            $sub->selectRaw('1')
                                ->from('projects')
                                ->whereColumn('projects.id', 'documents.documentable_id')
                                ->where('projects.is_official', true);
                        });
                })->orWhere(function (Builder $clientDocs) use ($clientType): void {
                    $clientDocs->where('documents.documentable_type', $clientType)
                        ->whereExists(function ($sub): void {
                            $sub->selectRaw('1')
                                ->from('clients')
                                ->whereColumn('clients.id', 'documents.documentable_id')
                                ->where('clients.is_official', true);
                        });
                })->orWhere(function (Builder $quoteDocs) use ($quoteType): void {
                    $quoteDocs->where('documents.documentable_type', $quoteType)
                        ->whereExists(function ($sub): void {
                            self::whereCommercialParentIsVisible($sub, 'quotes');
                        });
                })->orWhere(function (Builder $invoiceDocs) use ($invoiceType): void {
                    $invoiceDocs->where('documents.documentable_type', $invoiceType)
                        ->whereExists(function ($sub): void {
                            self::whereCommercialParentIsVisible($sub, 'invoices');
                        });
                });
            });
        });
    }

    public function scopeWithoutStealthScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('stealth_official');
    }

    /**
     * Quote/invoice documents stay visible only when the client is public
     * and any linked project is public.
     */
    private static function whereCommercialParentIsVisible($sub, string $table): void
    {
        $sub->selectRaw('1')
            ->from($table)
            ->join('clients', 'clients.id', '=', $table.'.client_id')
            ->leftJoin('projects', 'projects.id', '=', $table.'.project_id')
            ->whereColumn($table.'.id', 'documents.documentable_id')
            ->where('clients.is_official', true)
            ->where(function ($project) use ($table): void {
                $project->whereNull($table.'.project_id')
                    ->orWhere('projects.is_official', true);
            });
    }
}
