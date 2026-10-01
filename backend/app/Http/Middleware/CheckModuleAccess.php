<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\AdminModules;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckModuleAccess
{
    public const MESSAGE = 'Ce module n\'est pas activé pour votre compte.';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return $next($request);
        }

        $module = AdminModules::moduleForApiPath($request->path());

        if ($module === null || AdminModules::allows($user, $module)) {
            return $next($request);
        }

        abort(403, self::MESSAGE);
    }
}
