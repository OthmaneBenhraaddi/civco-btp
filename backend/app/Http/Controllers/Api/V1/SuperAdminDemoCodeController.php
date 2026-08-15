<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\DemoAccessCodeResource;
use App\Models\DemoAccessCode;
use App\Services\DemoAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class SuperAdminDemoCodeController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = DemoAccessCode::query()
            ->with(['createdBy', 'usedBy', 'demoTenant'])
            ->orderByDesc('created_at');

        if ($request->filled('is_used')) {
            $query->where('is_used', $request->boolean('is_used'));
        }

        return DemoAccessCodeResource::collection(
            $query->paginate($request->integer('per_page', 25))->withQueryString()
        );
    }

    public function store(Request $request, DemoAccessService $demoAccess): JsonResponse
    {
        $validated = $request->validate([
            'duration_hours' => ['required', 'integer', 'min:1', 'max:720'],
            'preset' => ['nullable', Rule::in(['12h', '1d', '2d', '3d', 'custom'])],
        ]);

        $code = $demoAccess->generate($request->user(), (int) $validated['duration_hours']);

        return (new DemoAccessCodeResource($code->load(['createdBy'])))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(DemoAccessCode $demoCode, DemoAccessService $demoAccess): JsonResponse
    {
        $demoAccess->revokeUnused($demoCode);

        return response()->json(['message' => 'Code démo révoqué.']);
    }
}
