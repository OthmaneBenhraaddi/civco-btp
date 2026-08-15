<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDemoSessionValid
{
    public const EXPIRED_CODE = 'demo_expired';

    public const EXPIRED_MESSAGE = 'Votre période de démo a expiré.';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->is_demo) {
            return $next($request);
        }

        $expiresAt = $user->demo_expires_at;

        if ($expiresAt !== null && $expiresAt->isPast()) {
            return response()->json([
                'message' => self::EXPIRED_MESSAGE,
                'code' => self::EXPIRED_CODE,
            ], 403);
        }

        return $next($request);
    }
}
