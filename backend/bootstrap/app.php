<?php

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
            'company' => \App\Http\Middleware\EnsureCompanyContext::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
            'user.status' => \App\Http\Middleware\CheckUserStatus::class,
            'tenant.subdomain' => \App\Http\Middleware\IdentifyTenantBySubdomain::class,
            'super_admin' => \App\Http\Middleware\EnsureSuperAdmin::class,
        ]);

        $middleware->appendToGroup('web', [
            \App\Http\Middleware\CheckUserStatus::class,
        ]);

        $middleware->appendToGroup('api', [
            \App\Http\Middleware\CheckUserStatus::class,
            \App\Http\Middleware\ResolveLocalTenantFallback::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
