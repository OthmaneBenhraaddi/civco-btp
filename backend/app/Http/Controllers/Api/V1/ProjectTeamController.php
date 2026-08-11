<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectMemberRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectTeamController extends Controller
{
    use ResolvesCompanyContext;

    public function store(StoreProjectMemberRequest $request, Project $project): ProjectResource
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $project->teamMembers()->syncWithoutDetaching([
            $request->integer('user_id') => [
                'role_label' => $request->input('role_label'),
                'assigned_at' => now()->toDateString(),
                'can_chat_with_client' => false,
            ],
        ]);

        return new ProjectResource($project->fresh()->load('teamMembers'));
    }

    public function toggleChat(Request $request, Project $project, User $user): ProjectResource
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        if (! $project->teamMembers()->where('users.id', $user->id)->exists()) {
            abort(404, 'Ce membre n\'est pas assigné à ce projet.');
        }

        $validated = $request->validate([
            'can_chat_with_client' => ['required', 'boolean'],
        ]);

        $project->teamMembers()->updateExistingPivot($user->id, [
            'can_chat_with_client' => $validated['can_chat_with_client'],
        ]);

        return new ProjectResource($project->fresh()->load('teamMembers'));
    }

    public function destroy(Request $request, Project $project, User $user): JsonResponse
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        if (! $project->teamMembers()->where('users.id', $user->id)->exists()) {
            abort(404);
        }

        $project->teamMembers()->detach($user->id);

        return response()->json(['message' => 'Team member removed.']);
    }

    private function ensureProjectBelongsToCompany(Request $request, Project $project): void
    {
        if ($project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
