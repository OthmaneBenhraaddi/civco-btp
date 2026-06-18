<?php

namespace App\Models;

use App\Enums\TaskStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    protected $fillable = [
        'project_phase_id',
        'assigned_to_user_id',
        'title',
        'description',
        'status',
        'progress_percent',
        'due_date',
        'completed_at',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'progress_percent' => 'decimal:2',
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function phase(): BelongsTo
    {
        return $this->belongsTo(ProjectPhase::class, 'project_phase_id');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }
}
