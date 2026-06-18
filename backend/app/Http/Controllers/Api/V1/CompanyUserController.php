<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CompanyUserController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request): AnonymousResourceCollection
    {
        $users = User::query()
            ->whereHas('companies', fn ($query) => $query->where('companies.id', $this->companyId($request)))
            ->where('is_active', true)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return UserResource::collection($users);
    }
}
