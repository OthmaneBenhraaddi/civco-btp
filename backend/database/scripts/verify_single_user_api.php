<?php

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use App\Models\Invoice;
use App\Models\Project;
use App\Models\User;
use App\Services\AuthContextService;
use App\Services\PermissionResolver;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

$email = $argv[1] ?? null;

if ($email === null) {
    fwrite(STDERR, "Usage: php verify_single_user_api.php user@example.com\n");
    exit(2);
}

$user = User::query()->where('email', $email)->first();

if ($user === null) {
    echo json_encode(['error' => 'user_not_found'], JSON_THROW_ON_ERROR);
    exit(1);
}

$user->loadMissing('tenant');
$tenant = $user->tenant?->subdomain;

if ($tenant === null) {
    echo json_encode(['error' => 'missing_tenant'], JSON_THROW_ON_ERROR);
    exit(1);
}

$context = app(AuthContextService::class)->forUser($user);
$permissions = $context['permissions'] ?? [];
$roleSlug = $context['roles'][0]['slug'] ?? 'unknown';
$permissionResolver = app(PermissionResolver::class);

$checks = [
    ['GET', '/api/v1/projects', 'project.view'],
    ['GET', '/api/v1/invoices', 'invoice.view'],
    ['GET', '/api/v1/quotes', 'quote.view'],
    ['GET', '/api/v1/clients', 'client.view'],
    ['GET', '/api/v1/dashboard/summary', 'dashboard.view'],
];

Auth::guard('web')->login($user);

$results = [];

foreach ($checks as [$method, $path, $permission]) {
    $shouldAllow = $permissionResolver->userHas($permissions, $permission);

    $request = Request::create($path, $method, [], [], [], [
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_ORIGIN' => 'http://127.0.0.1:5173',
        'HTTP_X_TENANT' => $tenant,
    ]);
    $request->setUserResolver(fn () => $user);

    $response = app()->handle($request);
    $status = $response->getStatusCode();
    $allowed = $status >= 200 && $status < 300;

    $results[] = [
        'method' => $method,
        'path' => $path,
        'permission' => $permission,
        'status' => $status,
        'should_allow' => $shouldAllow,
        'ok' => $shouldAllow === $allowed,
    ];
}

$projectCount = null;

if ($permissionResolver->userHas($permissions, 'project.view')) {
    $request = Request::create('/api/v1/projects', 'GET', [], [], [], [
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_ORIGIN' => 'http://127.0.0.1:5173',
        'HTTP_X_TENANT' => $tenant,
    ]);
    $request->setUserResolver(fn () => $user);
    $response = app()->handle($request);
    $payload = json_decode($response->getContent(), true);
    $projectCount = is_array($payload['data'] ?? null) ? count($payload['data']) : 0;
}

$companyId = $user->primaryCompany()?->id;
$assignedCount = $companyId === null ? 0 : Project::query()
    ->forCompany($companyId)
    ->whereHas('teamMembers', fn ($q) => $q->where('users.id', $user->id))
    ->count();

$invoiceCount = Invoice::query()->where('tenant_id', $user->tenant_id)->count();

echo json_encode([
    'email' => $email,
    'role' => $roleSlug,
    'tenant' => $tenant,
    'checks' => $results,
    'project_count' => $projectCount,
    'assigned_count' => $assignedCount,
    'invoice_count' => $invoiceCount,
], JSON_THROW_ON_ERROR);
