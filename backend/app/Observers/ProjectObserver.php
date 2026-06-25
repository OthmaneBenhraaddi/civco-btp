<?php

namespace App\Observers;

use App\Models\Project;
use App\Services\ActivityLogService;

class ProjectObserver
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function created(Project $project): void
    {
        $this->activityLogService->logProjectCreated($project);
    }

    public function updated(Project $project): void
    {
        $this->activityLogService->logProjectUpdated($project);
    }

    public function deleting(Project $project): void
    {
        $this->activityLogService->logProjectDeleted($project);
    }
}
