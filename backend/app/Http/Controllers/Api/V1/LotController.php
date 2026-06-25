<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Resources\LotResource;
use App\Models\Lot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class LotController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request): AnonymousResourceCollection
    {
        $companyId = $this->companyId($request);

        $query = Lot::query()
            ->forCompany($companyId)
            ->with('sector')
            ->join('sectors', 'sectors.id', '=', 'lots.sector_id')
            ->orderBy('sectors.name')
            ->orderBy('lots.name')
            ->select('lots.*');

        if ($sectorId = $request->integer('sector_id')) {
            $query->where('sector_id', $sectorId);
        }

        return LotResource::collection($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $companyId = $this->companyId($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sector_id' => [
                'required',
                'integer',
                Rule::exists('sectors', 'id')->where('company_id', $companyId),
            ],
        ]);

        $lot = Lot::query()->create([
            'company_id' => $companyId,
            'name' => $validated['name'],
            'sector_id' => $validated['sector_id'],
        ]);

        return (new LotResource($lot->load('sector')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Lot $lot): LotResource
    {
        $this->ensureLotBelongsToCompany($request, $lot);

        $companyId = $this->companyId($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'sector_id' => [
                'sometimes',
                'integer',
                Rule::exists('sectors', 'id')->where('company_id', $companyId),
            ],
        ]);

        $lot->update($validated);

        return new LotResource($lot->fresh()->load('sector'));
    }

    public function destroy(Request $request, Lot $lot): JsonResponse
    {
        $this->ensureLotBelongsToCompany($request, $lot);

        $lot->delete();

        return response()->json(['message' => 'Lot deleted.']);
    }

    private function ensureLotBelongsToCompany(Request $request, Lot $lot): void
    {
        if ($lot->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
