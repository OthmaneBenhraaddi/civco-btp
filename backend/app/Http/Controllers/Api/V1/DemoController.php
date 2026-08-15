<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\DemoAccessCodeResource;
use App\Services\AuthContextService;
use App\Services\DemoAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class DemoController extends Controller
{
    public function redeem(
        Request $request,
        DemoAccessService $demoAccess,
        AuthContextService $authContext,
    ): JsonResponse {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:32'],
        ]);

        $result = $demoAccess->redeem($validated['code'], $authContext);

        return response()->json([
            ...$result['context'],
            'demo' => $result['demo'],
        ]);
    }
}
