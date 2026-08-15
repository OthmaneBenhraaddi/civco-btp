<?php

namespace App\Services;

use App\Enums\ProjectStatus;
use App\Enums\TenantStatus;
use App\Models\Client;
use App\Models\DemoAccessCode;
use App\Models\Project;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DemoAccessService
{
    public function __construct(
        private readonly TenantProvisioningService $tenantProvisioningService,
    ) {}

    public function generate(User $actor, int $durationHours): DemoAccessCode
    {
        $durationHours = max(1, min(720, $durationHours));

        return DemoAccessCode::query()->create([
            'code' => $this->uniqueReadableCode(),
            'duration_hours' => $durationHours,
            'expires_at' => null,
            'is_used' => false,
            'created_by_user_id' => $actor->id,
        ]);
    }

    /**
     * @return array{context: array, demo: array{expires_at: string, remaining_seconds: int, code: string}}
     */
    public function redeem(string $rawCode, AuthContextService $authContext): array
    {
        $code = strtoupper(trim($rawCode));

        return DB::transaction(function () use ($code, $authContext) {
            $accessCode = DemoAccessCode::query()
                ->where('code', $code)
                ->lockForUpdate()
                ->first();

            if ($accessCode === null || ! $accessCode->isRedeemable()) {
                throw ValidationException::withMessages([
                    'code' => ['Code démo invalide, déjà utilisé ou expiré.'],
                ]);
            }

            $suffix = strtolower(Str::random(6));
            $subdomain = 'demo-'.$suffix;
            $name = 'Démo BTP '.$suffix;

            $provisioned = $this->tenantProvisioningService->provision(
                $name,
                $subdomain,
                TenantStatus::Active,
            );

            /** @var Tenant $tenant */
            $tenant = $provisioned['tenant'];
            /** @var User $admin */
            $admin = $provisioned['admin'];
            $company = $provisioned['company'];

            $expiresAt = now()->addHours($accessCode->duration_hours);

            $tenant->update([
                'is_demo' => true,
                'demo_expires_at' => $expiresAt,
            ]);

            $admin->forceFill([
                'is_demo' => true,
                'demo_expires_at' => $expiresAt,
                'first_name' => 'Démo',
                'last_name' => 'Visiteur',
            ])->save();

            $this->seedMinimalDemoData($tenant, $company->id);

            $accessCode->update([
                'is_used' => true,
                'used_at' => now(),
                'used_by_user_id' => $admin->id,
                'demo_tenant_id' => $tenant->id,
                'expires_at' => $expiresAt,
            ]);

            Auth::login($admin);

            if (request()->hasSession()) {
                request()->session()->regenerate();
                request()->session()->put('demo_expires_at', $expiresAt->toIso8601String());
            }

            $context = $authContext->forUser($admin->fresh());

            return [
                'context' => $context,
                'demo' => [
                    'expires_at' => $expiresAt->toIso8601String(),
                    'remaining_seconds' => max(0, $expiresAt->getTimestamp() - now()->getTimestamp()),
                    'code' => $accessCode->code,
                ],
            ];
        });
    }

    public function revokeUnused(DemoAccessCode $code): void
    {
        if ($code->is_used) {
            abort(422, 'Impossible de révoquer un code déjà utilisé.');
        }

        $code->delete();
    }

    /**
     * @return array{codes_deleted: int, tenants_deleted: int}
     */
    public function purgeExpired(): array
    {
        $codesDeleted = 0;
        $tenantsDeleted = 0;

        $expiredCodes = DemoAccessCode::query()
            ->where(function ($query): void {
                $query->where(function ($inner): void {
                    $inner->where('is_used', true)
                        ->whereNotNull('expires_at')
                        ->where('expires_at', '<', now());
                })->orWhere(function ($inner): void {
                    $inner->where('is_used', false)
                        ->where('created_at', '<', now()->subDays(30));
                });
            })
            ->get();

        foreach ($expiredCodes as $code) {
            if ($code->demo_tenant_id) {
                $tenant = Tenant::query()->find($code->demo_tenant_id);
                if ($tenant?->is_demo) {
                    $this->destroyDemoTenant($tenant);
                    $tenantsDeleted++;
                }
            }
            $code->delete();
            $codesDeleted++;
        }

        $orphanTenants = Tenant::query()
            ->where('is_demo', true)
            ->whereNotNull('demo_expires_at')
            ->where('demo_expires_at', '<', now()->subDay())
            ->get();

        foreach ($orphanTenants as $tenant) {
            $this->destroyDemoTenant($tenant);
            $tenantsDeleted++;
        }

        return [
            'codes_deleted' => $codesDeleted,
            'tenants_deleted' => $tenantsDeleted,
        ];
    }

    private function destroyDemoTenant(Tenant $tenant): void
    {
        DB::transaction(function () use ($tenant): void {
            $users = User::query()->where('tenant_id', $tenant->id)->get();
            $companyIds = [];

            foreach ($users as $user) {
                $companyIds = array_merge(
                    $companyIds,
                    $user->companies()->pluck('companies.id')->all(),
                );
                $user->tokens()->delete();
                $user->roles()->detach();
                $user->companies()->detach();
                $user->delete();
            }

            Client::query()->where('tenant_id', $tenant->id)->delete();
            Project::query()->where('tenant_id', $tenant->id)->delete();

            if ($companyIds !== []) {
                \App\Models\Company::query()->whereIn('id', array_unique($companyIds))->delete();
            }

            $tenant->delete();
        });
    }

    private function seedMinimalDemoData(Tenant $tenant, int $companyId): void
    {
        $client = Client::query()->create([
            'tenant_id' => $tenant->id,
            'company_id' => $companyId,
            'name' => 'Client Démo Atlas',
            'email' => 'client@'.$tenant->subdomain.'.demo',
            'phone' => '+212600000000',
            'city' => 'Casablanca',
            'country' => 'MA',
            'is_active' => true,
        ]);

        Project::query()->create([
            'tenant_id' => $tenant->id,
            'company_id' => $companyId,
            'client_id' => $client->id,
            'reference' => 'DEMO-PRJ-001',
            'title' => 'Chantier démo — Lotissement Vert',
            'description' => 'Projet de démonstration isolé.',
            'status' => ProjectStatus::InProgress,
            'nature' => 'BÂTIMENT',
            'sector' => 'PRIVÉ',
            'start_date' => now()->subMonths(2)->toDateString(),
            'end_date' => now()->addMonths(4)->toDateString(),
            'budget' => 1250000,
            'progress_percent' => 35,
            'site_city' => 'Casablanca',
            'site_address_line1' => 'Zone démo',
        ]);
    }

    private function uniqueReadableCode(): string
    {
        do {
            $code = 'DEMO-BTP-'.strtoupper(Str::random(4));
        } while (DemoAccessCode::query()->where('code', $code)->exists());

        return $code;
    }
}
