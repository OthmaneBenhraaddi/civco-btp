<?php

namespace App\Services;

use App\Enums\CompanyVisibility;
use App\Enums\TenantStatus;
use App\Enums\UserStatus;
use App\Models\Company;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantLogoStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TenantProvisioningService
{
    public function __construct(
        private readonly ThemeColorService $themeColorService,
        private readonly AdminCredentialService $adminCredentialService,
    ) {}

    /**
     * @return array{tenant: Tenant, company: Company, admin: User, temporary_password: string}
     */
    public function provision(
        string $name,
        string $subdomain,
        TenantStatus $status,
        ?UploadedFile $logo = null,
    ): array {
        $temporaryPassword = Str::password(12);

        return DB::transaction(function () use ($name, $subdomain, $status, $temporaryPassword, $logo): array {
            $logoPath = $logo !== null
                ? TenantLogoStorage::store($logo, $subdomain)
                : null;

            $tenant = Tenant::query()->create([
                'name' => $name,
                'subdomain' => $subdomain,
                'status' => $status,
                'logo_path' => $logoPath,
            ]);

            $company = Company::query()->create([
                'name' => $name,
                'legal_name' => $name,
                'siret' => $this->generateSiretPlaceholder($subdomain),
                'visibility' => CompanyVisibility::Private,
                'email' => "contact@{$subdomain}.ma",
                'is_active' => true,
                'country' => 'MA',
            ]);

            $adminRole = Role::query()
                ->whereNull('company_id')
                ->where('slug', 'admin')
                ->firstOrFail();

            $admin = User::query()->create([
                'tenant_id' => $tenant->id,
                'first_name' => 'Admin',
                'last_name' => $name,
                'email' => "admin@{$subdomain}.ma",
                'password' => Hash::make($temporaryPassword),
                'is_active' => true,
                'status' => UserStatus::Active,
                'role' => 'admin',
                'email_verified_at' => now(),
            ]);

            $company->users()->attach($admin->id, [
                'is_primary' => true,
                'joined_at' => now()->toDateString(),
            ]);

            $admin->roles()->sync([
                $adminRole->id => ['company_id' => $company->id],
            ]);

            $this->adminCredentialService->storeProvisionedPassword($admin, $temporaryPassword);

            $this->themeColorService->seedDefaultsForCompany($company->id);

            return [
                'tenant' => $tenant,
                'company' => $company,
                'admin' => $admin,
                'temporary_password' => $temporaryPassword,
            ];
        });
    }

    private function generateSiretPlaceholder(string $subdomain): string
    {
        $hash = substr(hash('crc32b', $subdomain), 0, 10);

        return str_pad($hash, 14, '0', STR_PAD_LEFT);
    }
}
