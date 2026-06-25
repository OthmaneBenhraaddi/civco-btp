<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        $companyId = $request->header('X-Company-Id') ?? $request->integer('company_id') ?: null;

        if ($companyId !== null) {
            $company = $user->companies()->where('companies.id', $companyId)->first();
        } else {
            $company = $user->primaryCompany();
        }

        if ($company === null) {
            abort(403, 'No company context available for this user.');
        }

        $request->attributes->set('company_id', $company->id);
        $request->attributes->set('company', $company);

        return $next($request);
    }
}
