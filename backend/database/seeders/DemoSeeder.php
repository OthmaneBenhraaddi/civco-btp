<?php

namespace Database\Seeders;

use App\Enums\CompanyVisibility;
use App\Enums\TenantStatus;
use App\Models\Company;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Services\ThemeColorService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::query()->firstOrCreate(
            ['subdomain' => 'civco'],
            [
                'name' => 'CIVCO BTP',
                'status' => TenantStatus::Active,
            ],
        );

        $company = Company::query()->updateOrCreate(
            ['siret' => '12345678901234'],
            [
                'name' => 'CIVCO BTP',
                'legal_name' => 'CIVCO BTP Société Anonyme',
                'visibility' => CompanyVisibility::Private,
                'email' => 'contact@civco-btp.ma',
                'phone' => '+212 522 456 789',
                'address_line1' => 'Zone Industrielle Aïn Sebaâ, Lot 24',
                'postal_code' => '20250',
                'city' => 'Casablanca',
                'country' => 'MA',
                'is_active' => true,
            ],
        );

        $adminRole = Role::query()->where('slug', 'admin')->whereNull('company_id')->firstOrFail();
        $projectManagerRole = Role::query()->where('slug', 'project_manager')->whereNull('company_id')->firstOrFail();
        $collaboratorRole = Role::query()->where('slug', 'collaborator')->whereNull('company_id')->firstOrFail();
        $conducteurRole = Role::query()->where('slug', 'conducteur_travaux')->whereNull('company_id')->firstOrFail();

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@btpdemo.fr'],
            [
                'tenant_id' => $tenant->id,
                'first_name' => 'Administrateur',
                'last_name' => 'Système',
                'phone' => '+212 661 000 101',
                'is_active' => true,
                'role' => 'admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $yassine = User::query()->updateOrCreate(
            ['email' => 'yassine.mansouri@civco-btp.ma'],
            [
                'tenant_id' => $tenant->id,
                'first_name' => 'Yassine',
                'last_name' => 'Mansouri',
                'phone' => '+212 661 482 730',
                'is_active' => true,
                'role' => 'user',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $amine = User::query()->updateOrCreate(
            ['email' => 'amine.alami@civco-btp.ma'],
            [
                'tenant_id' => $tenant->id,
                'first_name' => 'Amine',
                'last_name' => 'Alami',
                'phone' => '+212 662 918 445',
                'is_active' => true,
                'role' => 'user',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        User::query()->where('email', 'user@btpdemo.fr')->update(['is_active' => false]);

        $company->users()->sync([
            $admin->id => [
                'is_primary' => true,
                'joined_at' => now()->subYears(2)->toDateString(),
            ],
            $yassine->id => [
                'is_primary' => true,
                'joined_at' => now()->subYear()->toDateString(),
            ],
            $amine->id => [
                'is_primary' => true,
                'joined_at' => now()->subMonths(8)->toDateString(),
            ],
        ]);

        $admin->roles()->sync([
            $adminRole->id => ['company_id' => $company->id],
        ]);

        $yassine->roles()->sync([
            $projectManagerRole->id => ['company_id' => $company->id],
            $conducteurRole->id => ['company_id' => $company->id],
        ]);

        $amine->roles()->sync([
            $collaboratorRole->id => ['company_id' => $company->id],
        ]);

        app(ThemeColorService::class)->seedDefaultsForCompany($company->id);
    }
}
