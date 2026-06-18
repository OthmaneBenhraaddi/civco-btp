<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProgressSnapshotRequest;
use App\Http\Resources\ProgressSnapshotResource;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Models\ProgressSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProjectProgressController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request, Project $project): AnonymousResourceCollection
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        return ProgressSnapshotResource::collection(
            $project->progressSnapshots()->with('recordedBy')->get()
        );
    }

    public function store(StoreProgressSnapshotRequest $request, Project $project): JsonResponse
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $snapshot = $project->progressSnapshots()->create([
            'recorded_by_user_id' => $request->user()->id,
            'percent' => $request->input('percent'),
            'comment' => $request->input('comment'),
            'recorded_at' => $request->input('recorded_at', now()),
        ]);

        $project->update(['progress_percent' => $request->input('percent')]);

        return response()->json([
            'snapshot' => new ProgressSnapshotResource($snapshot->load('recordedBy')),
            'project' => new ProjectResource($project->fresh()->load('client')),
        ], 201);
    }

    private function ensureProjectBelongsToCompany(Request $request, Project $project): void
    {
        if ($project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
