<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Services\ClientQueryService;
use App\Services\GlobalSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly GlobalSearchService $searchService,
        private readonly ClientQueryService $clientQuery,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:120'],
            'tenant_id' => ['nullable', 'integer', 'exists:tenants,id'],
        ]);

        $user = $request->user();
        $tenantScope = $this->clientQuery->resolveTenantScope($request, $user);

        $results = $this->searchService->search(
            $user,
            $this->companyId($request),
            $validated['q'],
            $tenantScope,
        );

        return response()->json([
            'query' => $validated['q'],
            'results' => $results,
            'items' => collect($results['tenants'])
                ->merge($results['clients'])
                ->merge($results['projects'])
                ->merge($results['tasks'])
                ->values()
                ->all(),
        ]);
    }
}
