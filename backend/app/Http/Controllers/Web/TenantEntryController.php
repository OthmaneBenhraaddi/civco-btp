<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Support\TenantLoginUrl;
use App\Support\TenantRequestResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TenantEntryController extends Controller
{
    public function login(Request $request): RedirectResponse
    {
        if (TenantRequestResolver::shouldResolveFromRequest($request)) {
            $tenantKey = TenantRequestResolver::extractTenantKey($request);

            return redirect()->away(TenantLoginUrl::localFrontendLoginUrl($tenantKey));
        }

        if (TenantLoginUrl::isBareLocalHost($request->getHost())) {
            return redirect()->away(TenantLoginUrl::bareHostRedirect($request));
        }

        return redirect()->away(TenantLoginUrl::tenantFrontendLogin($request));
    }

    public function home(Request $request): RedirectResponse
    {
        if (TenantRequestResolver::shouldResolveFromRequest($request)) {
            $tenantKey = TenantRequestResolver::extractTenantKey($request);

            return redirect()->away(TenantLoginUrl::localFrontendHomeUrl($tenantKey));
        }

        if (TenantLoginUrl::isBareLocalHost($request->getHost())) {
            return redirect()->away(TenantLoginUrl::bareHostHomeRedirect($request));
        }

        $scheme = (string) config('tenancy.login_scheme', 'http');
        $frontendPort = (string) config('tenancy.frontend_port', '5173');
        $portSegment = $frontendPort !== '' ? ":{$frontendPort}" : '';
        $host = strtolower($request->getHost());

        return redirect()->away("{$scheme}://{$host}{$portSegment}/");
    }
}
