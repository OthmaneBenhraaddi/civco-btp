<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyInternalToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('services.internal.token', '');
        $provided = (string) ($request->bearerToken() ?: $request->header('X-Internal-Token', ''));

        if ($expected === '' || $provided === '' || ! hash_equals($expected, $provided)) {
            abort(401, 'Unauthorized.');
        }

        return $next($request);
    }
}
