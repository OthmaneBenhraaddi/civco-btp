<?php

namespace App\Services;

use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Models\Client;
use App\Models\Project;
use App\Models\ProjectComment;
use App\Models\ProjectMedia;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;

class ClientPortalService
{
    /**
     * @return Collection<int, Project>
     */
    public function activeProjectsForClient(Client $client): Collection
    {
        return Project::query()
            ->where('client_id', $client->id)
            ->whereIn('status', [
                ProjectStatus::Planned,
                ProjectStatus::InProgress,
                ProjectStatus::OnHold,
            ])
            ->with('amendments')
            ->orderByDesc('updated_at')
            ->get();
    }

    /**
     * @return Collection<int, Task>
     */
    public function upcomingMilestonesForProject(Project $project, int $days = 7): Collection
    {
        $start = now()->startOfDay();
        $end = now()->addDays($days)->endOfDay();

        return Task::query()
            ->whereHas('phase', fn ($query) => $query->where('project_id', $project->id))
            ->whereNotIn('status', [TaskStatus::Done])
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [$start, $end])
            ->with(['phase.project:id,title'])
            ->orderBy('due_date')
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * @return Collection<int, ProjectMedia>
     */
    public function mediaFeedForProject(Project $project, int $limit = 24): Collection
    {
        return ProjectMedia::query()
            ->where('project_id', $project->id)
            ->with('uploadedBy:id,first_name,last_name')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * @return Collection<int, ProjectComment>
     */
    public function commentsForProject(Project $project): Collection
    {
        return ProjectComment::query()
            ->where('project_id', $project->id)
            ->with('user:id,first_name,last_name,client_id')
            ->orderBy('created_at')
            ->get();
    }

    public function storeComment(Project $project, User $user, string $content): ProjectComment
    {
        return ProjectComment::query()->create([
            'tenant_id' => $project->tenant_id,
            'project_id' => $project->id,
            'user_id' => $user->id,
            'content' => $content,
        ])->load('user:id,first_name,last_name,client_id');
    }

    public function storeMedia(Project $project, User $user, UploadedFile $image, string $title): ProjectMedia
    {
        $filename = \App\Support\SecureUpload::uuidImageFilename($image);
        $path = $image->storeAs("project-media/{$project->id}", $filename, 'public');

        return ProjectMedia::query()->create([
            'tenant_id' => $project->tenant_id,
            'project_id' => $project->id,
            'uploaded_by_user_id' => $user->id,
            'title' => $title,
            'image_path' => $path,
        ])->load('uploadedBy:id,first_name,last_name');
    }
}
