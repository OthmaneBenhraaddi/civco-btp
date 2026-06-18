<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Company;
use Illuminate\Http\Request;

trait ResolvesCompanyContext
{
    protected function companyId(Request $request): int
    {
        return (int) $request->attributes->get('company_id');
    }

    protected function company(Request $request): Company
    {
        return $request->attributes->get('company');
    }
}
