<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminModuleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_entity_admin_modules_are_enforced_on_the_api(): void
    {
        config(['sanctum.stateful' => ['localhost', 'localhost:5173', '127.0.0.1', '127.0.0.1:8000']]);
        $this->seed(PermissionSeeder::class);
        $this->seed(RoleSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'CivCo',
            'subdomain' => 'civco',
            'status' => 'active',
        ]);
        $company = Company::query()->create([
            'name' => 'CivCo',
            'visibility' => 'private',
            'is_active' => true,
        ]);
        $restricted = $this->makeAdmin($tenant, $company, 'modules-a@civco.test', ['chantier']);
        $open = $this->makeAdmin($tenant, $company, 'modules-b@civco.test', null);

        $headers = ['Accept' => 'application/json'];

        $this->actingAs($restricted);
        $this->withHeaders($headers)->getJson('/api/v1/clients')->assertForbidden();
        $this->withHeaders($headers)->getJson('/api/v1/invoices')->assertForbidden();
        $this->withHeaders($headers)->getJson('/api/v1/tickets')->assertForbidden();
        $this->withHeaders($headers)->getJson('/api/v1/projects')->assertOk();

        $this->flushSession();
        $this->actingAs($open);
        $this->withHeaders($headers)->getJson('/api/v1/clients')->assertOk();
    }

    private function makeAdmin(Tenant $tenant, Company $company, string $email, ?array $modules): User
    {
        $user = User::query()->create([
            'tenant_id' => $tenant->id,
            'first_name' => 'Test',
            'last_name' => 'Admin',
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => 'admin',
            'enabled_modules' => $modules,
            'is_active' => true,
            'status' => 'active',
        ]);

        $user->companies()->attach($company->id, [
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $role = Role::query()->whereNull('company_id')->where('slug', 'admin')->firstOrFail();
        $user->roles()->attach($role->id, ['company_id' => $company->id]);

        return $user;
    }
}
