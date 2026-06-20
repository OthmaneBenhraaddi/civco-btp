<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkspaceTask extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'project_id',
        'project_name',
        'nom',
        'responsable_name',
        'responsable_avatar_url',
        'statut',
        'priorite',
        'echeance',
        'budget',
        'notes',
        'last_updated_by_user_id',
        'last_updated_by_name',
    ];

    protected function casts(): array
    {
        return [
            'echeance' => 'date',
            'budget' => 'decimal:2',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(WorkspaceTaskFile::class);
    }

    public function lastUpdatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_updated_by_user_id');
    }
}
