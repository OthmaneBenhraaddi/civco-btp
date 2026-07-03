<?php

namespace App\Services;

use App\Enums\DeliveryFormStatus;
use App\Enums\DispatchNoteStatus;
use App\Models\DeliveryForm;
use App\Models\DispatchNote;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DispatchNoteService
{
    public function __construct(
        private readonly DispatchNoteReferenceService $referenceService,
    ) {}

    /**
     * @param  list<int>  $deliveryFormIds
     */
    public function bundleDeliveryForms(
        int $companyId,
        int $clientId,
        array $deliveryFormIds,
        ?User $user = null,
    ): DispatchNote {
        if ($deliveryFormIds === []) {
            throw new InvalidArgumentException('Sélectionnez au moins un bon de livraison.');
        }

        $forms = DeliveryForm::query()
            ->forCompany($companyId)
            ->where('client_id', $clientId)
            ->whereIn('id', $deliveryFormIds)
            ->get();

        if ($forms->count() !== count($deliveryFormIds)) {
            throw new InvalidArgumentException('Un ou plusieurs bons de livraison sont invalides.');
        }

        foreach ($forms as $form) {
            if ($form->status !== DeliveryFormStatus::SignedAndStamped) {
                throw new InvalidArgumentException(
                    "Le BL {$form->reference} doit être au statut signé et cacheté."
                );
            }

            if ($form->dispatch_note_id !== null) {
                throw new InvalidArgumentException(
                    "Le BL {$form->reference} est déjà rattaché à un bordereau."
                );
            }
        }

        return DB::transaction(function () use ($companyId, $clientId, $forms, $user): DispatchNote {
            $tenantId = $this->resolveTenantId($user, $forms);

            $dispatchNote = DispatchNote::query()->create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'client_id' => $clientId,
                'reference_number' => $this->referenceService->nextForCompany($companyId),
                'status' => DispatchNoteStatus::Draft,
            ]);

            DeliveryForm::query()
                ->whereIn('id', $forms->pluck('id'))
                ->update(['dispatch_note_id' => $dispatchNote->id]);

            return $dispatchNote->load(['client', 'deliveryForms']);
        });
    }

    public function execute(DispatchNote $dispatchNote): DispatchNote
    {
        if ($dispatchNote->status !== DispatchNoteStatus::Draft) {
            throw new InvalidArgumentException('Seuls les bordereaux brouillon peuvent être exécutés.');
        }

        if ($dispatchNote->deliveryForms()->count() === 0) {
            throw new InvalidArgumentException('Le bordereau ne contient aucun bon de livraison.');
        }

        $dispatchNote->update([
            'status' => DispatchNoteStatus::Executed,
            'executed_at' => now(),
        ]);

        return $dispatchNote->fresh()->load(['client', 'deliveryForms']);
    }

    public function assertInvoiceDispatchNoteIsValid(?int $dispatchNoteId, int $companyId, int $clientId): DispatchNote
    {
        if ($dispatchNoteId === null) {
            throw new InvalidArgumentException(
                'Une facture ne peut être créée que si elle est liée à un bordereau de renvoi exécuté.'
            );
        }

        $dispatchNote = DispatchNote::query()
            ->forCompany($companyId)
            ->whereKey($dispatchNoteId)
            ->first();

        if ($dispatchNote === null) {
            throw new InvalidArgumentException('Bordereau de renvoi introuvable.');
        }

        if ($dispatchNote->client_id !== $clientId) {
            throw new InvalidArgumentException('Le bordereau ne correspond pas au client de la facture.');
        }

        if (! $dispatchNote->isExecuted()) {
            throw new InvalidArgumentException('Le bordereau de renvoi doit être exécuté avant facturation.');
        }

        return $dispatchNote;
    }

    private function resolveTenantId(?User $user, Collection $forms): ?int
    {
        if (function_exists('current_tenant')) {
            $tenant = current_tenant();

            if ($tenant instanceof Tenant) {
                return $tenant->id;
            }
        }

        if ($user?->tenant_id !== null) {
            return $user->tenant_id;
        }

        $project = $forms->first()?->project;

        return $project?->tenant_id;
    }
}
