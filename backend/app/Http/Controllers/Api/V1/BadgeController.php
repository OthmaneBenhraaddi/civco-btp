<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Resources\BadgeResource;
use App\Models\Badge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BadgeController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request): AnonymousResourceCollection
    {
        $badges = Badge::query()
            ->forCompany($this->companyId($request))
            ->where('type', $request->input('type', 'client'))
            ->orderBy('name')
            ->get();

        return BadgeResource::collection($badges);
    }

    public function store(Request $request): JsonResponse
    {
        $companyId = $this->companyId($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'type' => ['nullable', 'string', 'max:20'],
        ]);

        $badge = Badge::query()->create([
            'company_id' => $companyId,
            'name' => $validated['name'],
            'color' => strtoupper($validated['color']),
            'type' => $validated['type'] ?? 'client',
        ]);

        return (new BadgeResource($badge))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Badge $badge): BadgeResource
    {
        $this->ensureBadgeBelongsToCompany($request, $badge);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:50'],
            'color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'type' => ['sometimes', 'string', 'max:20'],
        ]);

        if (isset($validated['color'])) {
            $validated['color'] = strtoupper($validated['color']);
        }

        $badge->update($validated);

        return new BadgeResource($badge->fresh());
    }

    public function destroy(Request $request, Badge $badge): JsonResponse
    {
        $this->ensureBadgeBelongsToCompany($request, $badge);

        $badge->delete();

        return response()->json(['message' => 'Badge deleted.']);
    }

    private function ensureBadgeBelongsToCompany(Request $request, Badge $badge): void
    {
        if ($badge->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
