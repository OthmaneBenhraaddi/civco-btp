<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AuthContextService;
use App\Services\PermissionResolver;
use App\Services\PostLoginRedirectService;
use Illuminate\Console\Command;

class VerifyRoleAccessCommand extends Command
{
    protected $signature = 'app:verify-role-access';

    protected $description = 'Verify redirects, permissions, nav routes and API access for all seeded team roles';

    /** @var array<string, array{allowed: list<string>, denied: list<string>}> */
    private const ROUTE_MATRIX = [
        'admin' => [
            'allowed' => ['/', '/tasks', '/clients', '/discussions', '/tickets', '/map', '/projects', '/quotes', '/delivery-forms', '/invoices', '/history', '/team', '/configuration'],
            'denied' => ['/super-admin'],
        ],
        'accountant' => [
            'allowed' => ['/', '/clients', '/quotes', '/delivery-forms', '/invoices'],
            'denied' => ['/projects', '/tasks', '/map', '/team', '/configuration', '/history', '/discussions', '/tickets'],
        ],
        'chef_chantier' => [
            'allowed' => ['/', '/tasks', '/map', '/projects', '/tickets'],
            'denied' => ['/clients', '/quotes', '/delivery-forms', '/invoices', '/team', '/configuration', '/history', '/discussions'],
        ],
        'project_manager' => [
            'allowed' => ['/', '/tasks', '/clients', '/map', '/projects', '/quotes', '/delivery-forms', '/invoices', '/tickets'],
            'denied' => ['/team', '/configuration', '/history', '/discussions'],
        ],
        'collaborator' => [
            'allowed' => ['/', '/tasks', '/map', '/projects'],
            'denied' => ['/clients', '/quotes', '/delivery-forms', '/invoices', '/team', '/configuration', '/history', '/discussions', '/tickets'],
        ],
    ];

    /** @var array<string, string> */
    private const REDIRECT_MATRIX = [
        'admin' => '/',
        'accountant' => '/invoices',
        'chef_chantier' => '/projects',
        'project_manager' => '/projects',
        'collaborator' => '/projects',
    ];

    public function handle(
        AuthContextService $authContext,
        PermissionResolver $permissionResolver,
        PostLoginRedirectService $redirectService,
    ): int {
        $users = User::query()
            ->whereNotNull('tenant_id')
            ->whereNull('client_id')
            ->where('role', '!=', 'super_admin')
            ->orderBy('tenant_id')
            ->orderBy('email')
            ->get();

        $failures = 0;

        $this->info('=== Role access verification ===');
        $this->newLine();

        foreach ($users as $user) {
            $user->loadMissing('tenant');
            $tenant = $user->tenant?->subdomain;

            if ($tenant === null) {
                $this->error("[FAIL] {$user->email} — missing tenant");
                $failures++;

                continue;
            }

            $context = $authContext->forUser($user);
            $permissions = $context['permissions'] ?? [];
            $roleSlug = $context['roles'][0]['slug'] ?? 'unknown';
            $redirect = $redirectService->pathFor($user);

            $this->line("--- {$user->full_name} ({$user->email}) — {$roleSlug} @ {$tenant} ---");

            $expectedRedirect = self::REDIRECT_MATRIX[$roleSlug] ?? '/';
            if (! str_contains($redirect, $expectedRedirect)) {
                $this->error("  [FAIL] redirect {$redirect} (expected {$expectedRedirect})");
                $failures++;
            } else {
                $this->line("  [OK] redirect → {$expectedRedirect}");
            }

            $matrix = self::ROUTE_MATRIX[$roleSlug] ?? null;
            if ($matrix !== null) {
                foreach ($matrix['allowed'] as $path) {
                    if (! $this->routeAllowed($path, $permissions, $user, $roleSlug)) {
                        $this->error("  [FAIL] route {$path} should be allowed");
                        $failures++;
                    } else {
                        $this->line("  [OK] route allowed {$path}");
                    }
                }

                foreach ($matrix['denied'] as $path) {
                    if ($this->routeAllowed($path, $permissions, $user, $roleSlug)) {
                        $this->error("  [FAIL] route {$path} should be denied");
                        $failures++;
                    } else {
                        $this->line("  [OK] route denied {$path}");
                    }
                }
            }

            $failures += $this->verifyApiAccess($user, $tenant, $permissions, $permissionResolver, $roleSlug);

            $this->newLine();
        }

        if ($failures > 0) {
            $this->error("RESULT: {$failures} failure(s)");

            return self::FAILURE;
        }

        $this->info('RESULT: All role access checks passed.');

        return self::SUCCESS;
    }

    /** @param  list<string>  $permissions */
    private function routeAllowed(string $path, array $permissions, User $user, string $roleSlug): bool
    {
        if ($path === '/') {
            return in_array('dashboard.view', $permissions, true);
        }

        return match ($path) {
            '/clients' => $this->has($permissions, 'client.view'),
            '/quotes' => $this->has($permissions, 'quote.view'),
            '/delivery-forms' => $this->has($permissions, 'delivery_form.view'),
            '/invoices' => $this->has($permissions, 'invoice.view'),
            '/projects', '/map' => $this->has($permissions, 'project.view'),
            '/tasks' => $this->hasAny($permissions, ['project.view', 'task.view_all', 'task.view_own', 'manage_tasks']),
            '/discussions' => $user->isAdmin() && $user->tenant_id !== null,
            '/tickets' => $this->has($permissions, 'ticket.view'),
            '/history', '/configuration' => $user->isAdmin(),
            '/team' => $user->isAdmin() && $user->tenant_id !== null,
            default => false,
        };
    }

    /** @param  list<string>  $permissions */
    private function verifyApiAccess(
        User $user,
        string $tenant,
        array $permissions,
        PermissionResolver $permissionResolver,
        string $roleSlug,
    ): int {
        $script = base_path('database/scripts/verify_single_user_api.php');
        $command = sprintf('php %s %s', escapeshellarg($script), escapeshellarg($user->email));
        $output = shell_exec($command);

        if ($output === null || $output === '') {
            $this->error('  [FAIL] API subprocess returned no output');

            return 1;
        }

        try {
            $payload = json_decode($output, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            $this->error('  [FAIL] API subprocess returned invalid JSON');
            $this->line($output);

            return 1;
        }

        if (isset($payload['error'])) {
            $this->error('  [FAIL] API subprocess error: '.$payload['error']);

            return 1;
        }

        $failures = 0;

        foreach ($payload['checks'] as $check) {
            if ($check['ok']) {
                $this->line("  [OK] {$check['method']} {$check['path']} — HTTP {$check['status']}");
            } else {
                $this->error("  [FAIL] {$check['method']} {$check['path']} — HTTP {$check['status']} (expected ".($check['should_allow'] ? 'allow' : 'deny').')');
                $failures++;
            }
        }

        if (in_array($roleSlug, ['collaborator', 'chef_chantier', 'project_manager'], true)) {
            if (($payload['assigned_count'] ?? 0) === 0) {
                $this->error('  [FAIL] no assigned projects in seed data');
                $failures++;
            } else {
                $this->line('  [OK] '.($payload['assigned_count']).' assigned project(s)');
            }

            if ($permissionResolver->userHas($permissions, 'project.view') && ! $user->isAdmin()) {
                if (($payload['project_count'] ?? 0) === 0) {
                    $this->error('  [FAIL] GET /api/v1/projects returned empty list for assigned user');
                    $failures++;
                } else {
                    $this->line('  [OK] GET /api/v1/projects returned '.($payload['project_count']).' project(s)');
                }
            }
        }

        if ($roleSlug === 'accountant') {
            if (($payload['invoice_count'] ?? 0) === 0) {
                $this->error('  [FAIL] no invoices in seed data');
                $failures++;
            } else {
                $this->line('  [OK] '.($payload['invoice_count']).' invoice(s) in tenant');
            }
        }

        return $failures;
    }

    /** @param  list<string>  $permissions */
    private function has(array $permissions, string $slug): bool
    {
        return app(PermissionResolver::class)->userHas($permissions, $slug);
    }

    /** @param  list<string>  $permissions @param  list<string>  $slugs */
    private function hasAny(array $permissions, array $slugs): bool
    {
        foreach ($slugs as $slug) {
            if ($this->has($permissions, $slug)) {
                return true;
            }
        }

        return false;
    }
}
