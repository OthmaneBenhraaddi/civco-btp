<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\DemoRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\DemoRequestResource;
use App\Models\DemoRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class SuperAdminDemoRequestController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = DemoRequest::query()->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->trim().'%';
            $query->where(function ($builder) use ($term): void {
                $builder
                    ->where('full_name', 'like', $term)
                    ->orWhere('company_name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('phone', 'like', $term);
            });
        }

        return DemoRequestResource::collection(
            $query->paginate($request->integer('per_page', 25))->withQueryString()
        );
    }

    public function update(Request $request, DemoRequest $demoRequest): DemoRequestResource
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(DemoRequestStatus::class)],
        ]);

        $demoRequest->update([
            'status' => $validated['status'],
        ]);

        return new DemoRequestResource($demoRequest->fresh());
    }

    public function destroy(DemoRequest $demoRequest): JsonResponse
    {
        $demoRequest->delete();

        return response()->json(['message' => 'Demo request deleted.']);
    }
}
