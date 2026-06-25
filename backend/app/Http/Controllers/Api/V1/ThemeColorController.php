<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Services\ThemeColorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ThemeColorController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request, ThemeColorService $themeColorService): JsonResponse
    {
        return response()->json([
            'colors' => $themeColorService->allForCompany($this->companyId($request)),
        ]);
    }

    public function update(Request $request, ThemeColorService $themeColorService): JsonResponse
    {
        $validated = $request->validate([
            'colors' => ['required', 'array'],
            'colors.*' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $allowed = array_intersect_key(
            $validated['colors'],
            array_flip(array_keys(ThemeColorService::DEFAULTS)),
        );

        return response()->json([
            'colors' => $themeColorService->updateForCompany($this->companyId($request), $allowed),
        ]);
    }
}
