<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        $companyId = $request->attributes->get('company_id');

        if ($user === null || $companyId === null) {
            abort(401);
        }

        if (! in_array($permission, $user->permissionSlugsForCompany($companyId), true)) {
            abort(403, 'Insufficient permissions.');
        }

        return $next($request);
    }
}
