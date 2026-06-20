<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkspaceTaskFile extends Model
{
    protected $fillable = [
        'workspace_task_id',
        'filename',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(WorkspaceTask::class, 'workspace_task_id');
    }
}
