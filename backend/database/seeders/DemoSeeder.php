<?php

namespace Database\Seeders;

use App\Enums\CompanyVisibility;
use App\Models\Company;
use App\Models\Role;
use App\Models\User;
use App\Services\ThemeColorService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
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
        $collaboratorRole = Role::query()->where('slug', 'collaborator')->whereNull('company_id')->firstOrFail();

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@btpdemo.fr'],
            [
                'first_name' => 'Administrateur',
                'last_name' => 'Système',
                'phone' => '0600000000',
                'is_active' => true,
                'role' => 'admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $teamMember = User::query()->updateOrCreate(
            ['email' => 'user@btpdemo.fr'],
            [
                'first_name' => 'Membre',
                'last_name' => 'Équipe',
                'phone' => '0600000001',
                'is_active' => true,
                'role' => 'user',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $company->users()->syncWithoutDetaching([
            $admin->id => [
                'is_primary' => true,
                'joined_at' => now()->toDateString(),
            ],
            $teamMember->id => [
                'is_primary' => true,
                'joined_at' => now()->toDateString(),
            ],
        ]);

        $admin->roles()->syncWithoutDetaching([
            $adminRole->id => ['company_id' => $company->id],
        ]);

        $teamMember->roles()->syncWithoutDetaching([
            $collaboratorRole->id => ['company_id' => $company->id],
        ]);

        app(ThemeColorService::class)->seedDefaultsForCompany($company->id);
    }
}
