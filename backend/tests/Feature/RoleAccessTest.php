<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\AuthContextService;
use App\Services\PermissionResolver;
use App\Services\PostLoginRedirectService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    private function authHeaders(string $tenant): array
    {
        return [
            'Origin' => 'http://127.0.0.1:5173',
            'Accept' => 'application/json',
            'X-Tenant' => $tenant,
        ];
    }

    private function actingAsTenantUser(string $email): User
    {
        $user = User::query()->where('email', $email)->firstOrFail();
        $this->actingAs($user);

        return $user;
    }

    public function test_accountant_redirects_to_invoices_and_can_read_financials(): void
    {
        $user = $this->actingAsTenantUser('compta@atlas.ma');
        $redirect = app(PostLoginRedirectService::class)->pathFor($user);

        $this->assertStringContainsString('/invoices', $redirect);

        $context = app(AuthContextService::class)->forUser($user);
        $permissions = $context['permissions'];

        $this->assertTrue(app(PermissionResolver::class)->userHas($permissions, 'invoice.view'));
        $this->assertFalse(app(PermissionResolver::class)->userHas($permissions, 'project.view'));

        $this->withHeaders($this->authHeaders('atlas'))
            ->getJson('/api/v1/invoices')
            ->assertOk();

        $this->withHeaders($this->authHeaders('atlas'))
            ->getJson('/api/v1/quotes')
            ->assertOk();

        $this->withHeaders($this->authHeaders('atlas'))
            ->getJson('/api/v1/clients')
            ->assertOk();

        $this->withHeaders($this->authHeaders('atlas'))
            ->getJson('/api/v1/projects')
            ->assertForbidden();
    }

    public function test_technician_can_view_projects_but_not_invoices_management_endpoints_without_permission(): void
    {
        $user = $this->actingAsTenantUser('tech@atlas.ma');
        $redirect = app(PostLoginRedirectService::class)->pathFor($user);

        $this->assertStringContainsString('/projects', $redirect);

        $this->withHeaders($this->authHeaders('atlas'))
            ->getJson('/api/v1/projects')
            ->assertOk();

        $context = app(AuthContextService::class)->forUser($user);
        $permissions = $context['permissions'];

        $this->assertTrue(app(PermissionResolver::class)->userHas($permissions, 'project.view'));
        $this->assertFalse(app(PermissionResolver::class)->userHas($permissions, 'invoice.view'));
    }

    public function test_tenant_admin_redirects_to_dashboard(): void
    {
        $user = $this->actingAsTenantUser('admin@atlas.ma');
        $redirect = app(PostLoginRedirectService::class)->pathFor($user);

        $this->assertSame('/?tenant=atlas', $redirect);

        $this->withHeaders($this->authHeaders('atlas'))
            ->getJson('/api/v1/projects')
            ->assertOk();

        $this->withHeaders($this->authHeaders('atlas'))
            ->getJson('/api/v1/invoices')
            ->assertOk();
    }
}
