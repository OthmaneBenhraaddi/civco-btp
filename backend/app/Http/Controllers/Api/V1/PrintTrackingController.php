<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Print\TrackPrintRequest;
use App\Services\PrintTrackingService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class PrintTrackingController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly PrintTrackingService $printTrackingService,
    ) {}

    public function track(TrackPrintRequest $request): JsonResponse
    {
        try {
            $result = $this->printTrackingService->trackPrint(
                $request->validated('document_type'),
                $request->integer('document_id'),
                $this->companyId($request),
                $request->boolean('has_header', true),
            );
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json($result);
    }
}
