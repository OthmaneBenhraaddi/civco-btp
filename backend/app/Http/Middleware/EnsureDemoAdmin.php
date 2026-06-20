<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureDemoAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = User::query()
            ->where('email', 'admin@btpdemo.fr')
            ->where('is_active', true)
            ->first();

        if ($user === null) {
            abort(503, 'Demo admin user not found. Run: php artisan db:seed');
        }

        if (! Auth::check() || Auth::id() !== $user->id) {
            Auth::login($user);
        }

        return $next($request);
    }
}
