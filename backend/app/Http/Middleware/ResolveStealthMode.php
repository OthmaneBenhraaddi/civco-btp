<?php

namespace App\Http\Middleware;

use App\Support\StealthModeManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveStealthMode
{
    public function handle(Request $request, Closure $next): Response
    {
        StealthModeManager::setActive($this->isEnabled($request));

        try {
            return $next($request);
        } finally {
            StealthModeManager::disable();
        }
    }

    private function isEnabled(Request $request): bool
    {
        if ($request->headers->has('X-Stealth-Mode')) {
            $header = strtolower(trim((string) $request->header('X-Stealth-Mode', '')));

            return in_array($header, ['1', 'true', 'enabled', 'on', 'yes'], true);
        }

        return $request->hasSession()
            && $request->session()->get(StealthModeManager::SESSION_KEY) === true;
    }
}
