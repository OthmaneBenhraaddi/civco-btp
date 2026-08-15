<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Demo sessions may explore and edit disposable data, but not destroy
 * platform/master settings or permanently delete core records.
 */
class RejectDemoDestructiveActions
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->is_demo) {
            return $next($request);
        }

        $method = strtoupper($request->method());
        $path = '/'.ltrim($request->path(), '/');

        $blockedPrefixes = [
            '/api/v1/super-admin',
            '/api/v1/roles',
            '/api/v1/permissions',
            '/api/v1/team/members',
            '/api/v1/tenant/logo',
            '/api/v1/tenant/document-controls',
            '/api/v1/theme-colors',
        ];

        foreach ($blockedPrefixes as $prefix) {
            if (str_starts_with($path, $prefix) && in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
                return $this->forbidden();
            }
        }

        if ($method === 'DELETE') {
            return $this->forbidden();
        }

        if ($method === 'PATCH' && (
            str_contains($path, '/archive')
            || str_contains($path, '/status')
            || str_contains($path, '/reset-password')
        )) {
            return $this->forbidden();
        }

        return $next($request);
    }

    private function forbidden(): Response
    {
        return response()->json([
            'message' => 'Action non disponible en mode démo.',
            'code' => 'demo_restricted',
        ], 403);
    }
}
