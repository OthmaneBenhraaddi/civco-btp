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
        $header = strtolower(trim((string) $request->header('X-Stealth-Mode', '')));
        $enabled = in_array($header, ['1', 'true', 'enabled', 'on', 'yes'], true);

        StealthModeManager::setActive($enabled);

        try {
            return $next($request);
        } finally {
            StealthModeManager::disable();
        }
    }
}
