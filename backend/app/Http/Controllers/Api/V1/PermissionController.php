<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Resources\PermissionResource;
use App\Models\Permission;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PermissionController extends Controller
{
    use ResolvesCompanyContext;

    public function index(): AnonymousResourceCollection
    {
        $permissions = Permission::query()
            ->orderBy('module')
            ->orderBy('name')
            ->get();

        return PermissionResource::collection($permissions);
    }
}
