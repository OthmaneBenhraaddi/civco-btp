<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgressSnapshot extends Model
{
    protected $fillable = [
        'project_id',
        'recorded_by_user_id',
        'percent',
        'comment',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'percent' => 'decimal:2',
            'recorded_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }
}
