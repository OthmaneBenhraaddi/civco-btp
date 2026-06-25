<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Resources\SectorResource;
use App\Models\Sector;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class SectorController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Sector::query()
            ->forCompany($this->companyId($request))
            ->withCount('lots')
            ->orderBy('name');

        if ($request->boolean('with_lots')) {
            $query->with('lots');
        }

        return SectorResource::collection($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $companyId = $this->companyId($request);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('sectors', 'name')->where('company_id', $companyId),
            ],
        ]);

        $sector = Sector::query()->create([
            'company_id' => $companyId,
            'name' => $validated['name'],
        ]);

        return (new SectorResource($sector->loadCount('lots')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Sector $sector): SectorResource
    {
        $this->ensureSectorBelongsToCompany($request, $sector);

        $companyId = $this->companyId($request);

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('sectors', 'name')
                    ->where('company_id', $companyId)
                    ->ignore($sector->id),
            ],
        ]);

        $sector->update($validated);

        return new SectorResource($sector->fresh()->loadCount('lots'));
    }

    public function destroy(Request $request, Sector $sector): JsonResponse
    {
        $this->ensureSectorBelongsToCompany($request, $sector);

        if ($sector->lots()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a sector that still has lots assigned.',
            ], 422);
        }

        $sector->delete();

        return response()->json(['message' => 'Sector deleted.']);
    }

    private function ensureSectorBelongsToCompany(Request $request, Sector $sector): void
    {
        if ($sector->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
