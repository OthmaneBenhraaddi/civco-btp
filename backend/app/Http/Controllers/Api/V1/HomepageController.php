<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\HomepageContentService;
use Illuminate\Http\JsonResponse;

class HomepageController extends Controller
{
    public function show(HomepageContentService $homepage): JsonResponse
    {
        return response()->json($homepage->publicPayload());
    }
}
