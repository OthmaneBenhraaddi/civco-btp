<?php

use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\CheckUserStatus;
use App\Http\Middleware\EnsureCompanyContext;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\IdentifyTenantBySubdomain;
use App\Http\Middleware\ResolveLocalTenantFallback;
use App\Http\Middleware\ResolveStealthMode;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            require base_path('routes/tenancy.php');
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return null;
            }

            return '/';
        });
        $middleware->alias([
            'company' => EnsureCompanyContext::class,
            'permission' => CheckPermission::class,
            'admin' => EnsureUserIsAdmin::class,
            'user.status' => CheckUserStatus::class,
            'tenant.subdomain' => IdentifyTenantBySubdomain::class,
            'super_admin' => EnsureSuperAdmin::class,
        ]);

        $middleware->appendToGroup('web', [
            CheckUserStatus::class,
        ]);

        $middleware->appendToGroup('api', [
            CheckUserStatus::class,
            ResolveLocalTenantFallback::class,
            ResolveStealthMode::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
