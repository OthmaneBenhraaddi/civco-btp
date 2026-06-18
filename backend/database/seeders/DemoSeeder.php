<?php

namespace Database\Seeders;

use App\Enums\CompanyVisibility;
use App\Models\Company;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::query()->updateOrCreate(
            ['siret' => '12345678901234'],
            [
                'name' => 'BTP Groupe',
                'legal_name' => 'BTP Groupe Société à Responsabilité Limitée',
                'visibility' => CompanyVisibility::Private,
                'email' => 'contact@btpdemo.fr',
                'phone' => '0100000000',
                'address_line1' => '1 rue du Chantier',
                'postal_code' => '75001',
                'city' => 'Paris',
                'country' => 'FR',
                'is_active' => true,
            ],
        );

        $adminRole = Role::query()->where('slug', 'admin')->whereNull('company_id')->firstOrFail();

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@btpdemo.fr'],
            [
                'first_name' => 'Administrateur',
                'last_name' => 'Système',
                'phone' => '0600000000',
                'is_active' => true,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $company->users()->syncWithoutDetaching([
            $admin->id => [
                'is_primary' => true,
                'joined_at' => now()->toDateString(),
            ],
        ]);

        $admin->roles()->syncWithoutDetaching([
            $adminRole->id => ['company_id' => $company->id],
        ]);
    }
}
