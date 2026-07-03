<?php

namespace App\Http\Middleware;

use App\Enums\TenantStatus;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    public const DEACTIVATED_MESSAGE = 'Votre compte ou votre entité a été désactivé. Veuillez contacter le support.';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return $next($request);
        }

        $user->loadMissing('tenant');

        if ($user->canAccessApplication()) {
            return $next($request);
        }

        $this->terminateSession($request);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => self::DEACTIVATED_MESSAGE,
            ], 403);
        }

        return redirect()
            ->guest('/login')
            ->withErrors(['email' => self::DEACTIVATED_MESSAGE]);
    }

    private function terminateSession(Request $request): void
    {
        $user = $request->user();

        if ($user !== null) {
            $token = $user->currentAccessToken();

            if ($token !== null && method_exists($token, 'delete')) {
                $token->delete();
            }

            $user->tokens()->delete();
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
    }
}
