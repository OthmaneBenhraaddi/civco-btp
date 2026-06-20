<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AuthContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function me(Request $request, AuthContextService $authContext): JsonResponse
    {
        $companyId = $request->filled('company_id')
            ? $request->integer('company_id')
            : null;

        return response()->json(
            $authContext->forUser($request->user(), $companyId)
        );
    }
}
