<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProjectMedia\StoreProjectMediaRequest;
use App\Http\Resources\ProjectMediaResource;
use App\Models\Project;
use App\Services\ClientPortalService;
use Illuminate\Http\JsonResponse;

class ProjectMediaController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly ClientPortalService $clientPortalService,
    ) {}

    public function store(StoreProjectMediaRequest $request, Project $project): JsonResponse
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $media = $this->clientPortalService->storeMedia(
            $project,
            $request->user(),
            $request->file('image'),
            $request->validated('title'),
        );

        return (new ProjectMediaResource($media))
            ->response()
            ->setStatusCode(201);
    }

    private function ensureProjectBelongsToCompany($request, Project $project): void
    {
        if ($project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
