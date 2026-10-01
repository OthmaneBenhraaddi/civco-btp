<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CmsTicketTest extends TestCase
{
    use RefreshDatabase;

    public function test_cms_tickets_share_the_entity_ticket_inbox_with_targeted_visibility(): void
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

        $adminA = $this->makeStaff($tenant, $company, 'admin-a@civco.test', 'admin', 'admin');
        $adminB = $this->makeStaff($tenant, $company, 'admin-b@civco.test', 'admin', 'admin');
        $staff = $this->makeStaff($tenant, $company, 'staff@civco.test', 'user', 'project_manager');
        $client = Client::query()->create([
            'tenant_id' => $tenant->id,
            'company_id' => $company->id,
            'name' => 'Client Public',
            'is_active' => true,
        ]);
        $portalUser = User::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'first_name' => 'Port',
            'last_name' => 'Al',
            'email' => 'portal@civco.test',
            'password' => Hash::make('password'),
            'role' => 'user',
            'is_active' => true,
            'status' => 'active',
        ]);
        $superadmin = User::query()->create([
            'tenant_id' => null,
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'root@civco.test',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'is_active' => true,
            'status' => 'active',
        ]);

        $headers = ['Accept' => 'application/json'];

        $this->asUser($adminA);
        $clientTicket = $this->withHeaders($headers)->postJson('/api/v1/tickets', [
            'recipient' => 'client',
            'client_id' => $client->id,
            'title' => 'Client thread',
            'category' => 'Autre',
            'priority' => 'medium',
            'body' => 'Bonjour client',
        ])->assertCreated();

        $this->asUser($superadmin);
        $broadcast = $this->withHeaders($headers)->postJson('/api/v1/super-admin/tickets', [
            'tenant_id' => $tenant->id,
            'title' => 'Broadcast CMS',
            'category' => 'Autre',
            'priority' => 'high',
            'body' => 'Message à toute l\'entité',
        ])->assertCreated()
            ->assertJsonPath('data.is_cms_ticket', true)
            ->assertJsonPath('data.target_admin_id', null);

        $targeted = $this->withHeaders($headers)->postJson('/api/v1/super-admin/tickets', [
            'tenant_id' => $tenant->id,
            'target_admin_id' => $adminA->id,
            'title' => 'Private CMS',
            'category' => 'Autre',
            'priority' => 'high',
            'body' => 'Réservé à l\'admin A',
        ])->assertCreated()
            ->assertJsonPath('data.target_admin_id', $adminA->id);

        $this->asUser($adminA);
        $ownCms = $this->withHeaders($headers)->postJson('/api/v1/tickets', [
            'recipient' => 'cms',
            'title' => 'Admin to CMS',
            'category' => 'Autre',
            'priority' => 'medium',
            'body' => 'Besoin du support',
        ])->assertCreated()
            ->assertJsonPath('data.is_cms_ticket', true)
            ->assertJsonPath('data.target_admin_id', $adminA->id)
            ->assertJsonPath('data.client_id', null);

        $adminAIds = $this->titlesFor($adminA, $headers);
        $this->assertEqualsCanonicalizing(
            ['Client thread', 'Broadcast CMS', 'Private CMS', 'Admin to CMS'],
            $adminAIds,
        );

        $adminBIds = $this->titlesFor($adminB, $headers);
        $this->assertEqualsCanonicalizing(
            ['Client thread', 'Broadcast CMS'],
            $adminBIds,
        );

        $this->asUser($adminB);
        $this->withHeaders($headers)
            ->getJson('/api/v1/tickets/'.$targeted->json('data.id'))
            ->assertForbidden();

        $this->asUser($staff);
        $staffTitles = $this->titlesFor($staff, $headers);
        $this->assertSame(['Client thread'], $staffTitles);
        $this->withHeaders($headers)
            ->getJson('/api/v1/tickets/'.$broadcast->json('data.id'))
            ->assertForbidden();

        $this->asUser($portalUser);
        $portalTitles = collect($this->withHeaders($headers)
            ->getJson('/api/v1/client-portal/tickets')
            ->assertOk()
            ->json('data'))->pluck('title')->all();
        $this->assertSame(['Client thread'], $portalTitles);
        $this->withHeaders($headers)
            ->getJson('/api/v1/client-portal/tickets/'.$broadcast->json('data.id'))
            ->assertNotFound();

        $this->asUser($adminA);
        $this->withHeaders($headers)->postJson('/api/v1/tickets', [
            'recipient' => 'client',
            'client_id' => $client->id,
            'title' => 'Still a client ticket',
            'category' => 'Autre',
            'priority' => 'low',
            'body' => 'Le flux client reste intact',
        ])->assertCreated()
            ->assertJsonPath('data.is_cms_ticket', false)
            ->assertJsonPath('data.client_id', $client->id);

        $this->assertNotNull($clientTicket->json('data.id'));
        $this->assertNotNull($ownCms->json('data.id'));
    }

    private function asUser(User $user): static
    {
        $this->flushSession();

        return $this->actingAs($user);
    }

    private function titlesFor(User $user, array $headers): array
    {
        $this->asUser($user);

        return collect($this->withHeaders($headers)
            ->getJson('/api/v1/tickets')
            ->assertOk()
            ->json('data'))
            ->pluck('title')
            ->all();
    }

    private function makeStaff(Tenant $tenant, Company $company, string $email, string $userRole, string $roleSlug): User
    {
        $user = User::query()->create([
            'tenant_id' => $tenant->id,
            'first_name' => 'Test',
            'last_name' => $email,
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => $userRole,
            'is_active' => true,
            'status' => 'active',
        ]);

        $user->companies()->attach($company->id, [
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $role = Role::query()->whereNull('company_id')->where('slug', $roleSlug)->firstOrFail();
        $user->roles()->attach($role->id, ['company_id' => $company->id]);

        return $user;
    }
}
