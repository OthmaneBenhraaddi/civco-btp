<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Base application domain
    |--------------------------------------------------------------------------
    |
    | Tenant URLs follow the pattern: {subdomain}.monerp.com
    | Example: civco.monerp.com → tenant subdomain "civco"
    |
    */
    'base_domain' => env('TENANCY_BASE_DOMAIN', 'monerp.com'),

    /*
    |--------------------------------------------------------------------------
    | Subdomain routing
    |--------------------------------------------------------------------------
    |
    | Disable in local development (localhost) and enable in staging/production.
    |
    */
    'subdomain_routing_enabled' => env('TENANCY_SUBDOMAIN_ROUTING', false),

    /*
    |--------------------------------------------------------------------------
    | Login / entry URLs
    |--------------------------------------------------------------------------
    |
    | login_port: URL shown after tenant provisioning (backend entry, redirects to SPA).
    | frontend_port: Vite / React dev server port for bare-host redirects.
    |
    */
    'login_scheme' => env('TENANCY_LOGIN_SCHEME', 'http'),
    'login_port' => env('TENANCY_LOGIN_PORT', '8000'),
    'frontend_port' => env('TENANCY_FRONTEND_PORT', '5173'),
    'fallback_path' => '/login',
    'super_admin_path' => '/super-admin',

    'local_hosts' => [
        'localhost',
        '127.0.0.1',
    ],

    /*
    |--------------------------------------------------------------------------
    | Local query-string tenant fallback (?tenant=civco or X-Tenant header)
    |--------------------------------------------------------------------------
    */
    'local_query_fallback' => env('TENANCY_LOCAL_QUERY_FALLBACK', true),
    'local_login_host' => env('TENANCY_LOCAL_LOGIN_HOST', 'localhost'),
    'local_frontend_host' => env('TENANCY_LOCAL_FRONTEND_HOST', '127.0.0.1'),

    /*
    |--------------------------------------------------------------------------
    | Ignored subdomain labels
    |--------------------------------------------------------------------------
    |
    | These host prefixes are never resolved as tenant subdomains.
    |
    */
    'ignored_subdomains' => [
        'www',
        'api',
        'admin',
        'app',
    ],

];
