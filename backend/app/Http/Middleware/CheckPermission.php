<?php

namespace App\Http\Middleware;

use App\Services\PermissionResolver;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function __construct(
        private readonly PermissionResolver $permissionResolver,
    ) {}

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        $companyId = $request->attributes->get('company_id');

        if ($user === null || $companyId === null) {
            abort(401);
        }

        $userSlugs = $user->permissionSlugsForCompany($companyId);
        $required = explode('|', $permission);

        foreach ($required as $slug) {
            if ($this->permissionResolver->userHas($userSlugs, trim($slug))) {
                return $next($request);
            }
        }

        abort(403, 'Insufficient permissions.');
    }
}
