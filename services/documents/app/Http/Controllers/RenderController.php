<?php

namespace App\Http\Controllers;

use App\Dto\RenderRequest;
use App\Http\Requests\RenderDocumentRequest;
use App\Rendering\DocumentRenderer;
use Illuminate\Http\JsonResponse;

class RenderController extends Controller
{
    public function __invoke(RenderDocumentRequest $request, DocumentRenderer $renderer): JsonResponse
    {
        $result = $renderer->render(RenderRequest::fromArray($request->validated()));

        return response()->json($result->toArray());
    }
}
