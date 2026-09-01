<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\DemoRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Demo\StoreDemoRequestRequest;
use App\Models\DemoRequest;
use App\Services\AuthContextService;
use App\Services\DemoAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function storeRequest(StoreDemoRequestRequest $request): JsonResponse
    {
        $demoRequest = DemoRequest::query()->create([
            ...$request->validated(),
            'status' => DemoRequestStatus::Pending,
        ]);

        return response()->json([
            'message' => 'Demo request received.',
            'data' => [
                'id' => $demoRequest->id,
                'status' => $demoRequest->status->value,
            ],
        ], 201);
    }
}
