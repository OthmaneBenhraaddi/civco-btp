<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        return response()->json(
            $this->dashboardService->summaryForCompany($this->companyId($request)),
        );
    }
}
