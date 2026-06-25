<?php

namespace App\Observers;

use App\Models\Task;
use App\Services\ActivityLogService;

class TaskObserver
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function created(Task $task): void
    {
        $this->activityLogService->logTaskCreated($task);
    }

    public function updated(Task $task): void
    {
        $this->activityLogService->logTaskUpdated($task);
    }

    public function deleting(Task $task): void
    {
        $task->loadMissing('phase.project');
        $this->activityLogService->logTaskDeleted($task, $task->phase);
    }
}
