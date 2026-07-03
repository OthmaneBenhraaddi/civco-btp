<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tenant-aware route registration
|--------------------------------------------------------------------------
|
| When TENANCY_SUBDOMAIN_ROUTING=true, API and web routes are served on:
|   https://{subdomain}.monerp.com
|
| Bare localhost / 127.0.0.1 keeps system routes (super-admin API, login redirect).
|
*/

$baseDomain = config('tenancy.base_domain');
$tenantDomain = '{subdomain}.'.$baseDomain;
$localHosts = config('tenancy.local_hosts', ['localhost', '127.0.0.1']);

$registerApiRoutes = function (): void {
    require __DIR__.'/api.php';
};

$registerWebRoutes = function (): void {
    require __DIR__.'/web.php';
};

if (config('tenancy.subdomain_routing_enabled')) {
    Route::middleware('api')
        ->prefix('api')
        ->domain($tenantDomain)
        ->middleware('tenant.subdomain')
        ->group($registerApiRoutes);

    Route::middleware('web')
        ->domain($tenantDomain)
        ->middleware('tenant.subdomain')
        ->group($registerWebRoutes);

    foreach ($localHosts as $localHost) {
        Route::middleware('api')
            ->prefix('api')
            ->domain($localHost)
            ->group($registerApiRoutes);

        Route::middleware('web')
            ->domain($localHost)
            ->group($registerWebRoutes);
    }
} else {
    Route::middleware('api')
        ->prefix('api')
        ->group($registerApiRoutes);

    $registerWebRoutes();
}
