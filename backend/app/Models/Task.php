<?php

namespace App\Models;

use App\Enums\TaskStatus;
use App\Models\Concerns\AppliesStealthViaProjectPhase;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use AppliesStealthViaProjectPhase, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'project_phase_id',
        'assigned_to_user_id',
        'title',
        'description',
        'quantity',
        'unit',
        'unit_price',
        'status',
        'progress_percent',
        'planned_start_date',
        'due_date',
        'completed_at',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'progress_percent' => 'decimal:2',
            'quantity' => 'decimal:3',
            'unit_price' => 'decimal:2',
            'planned_start_date' => 'date',
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
