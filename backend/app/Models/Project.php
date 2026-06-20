<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Project extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'client_id',
        'reference',
        'title',
        'description',
        'description_meta',
        'status',
        'nature',
        'sector',
        'etat_paiement',
        'delais',
        'avancement',
        'start_date',
        'end_date',
        'actual_start_date',
        'actual_end_date',
        'budget',
        'progress_percent',
        'site_address_line1',
        'site_city',
        'site_postal_code',
    ];

    protected function casts(): array
    {
        return [
            'status' => ProjectStatus::class,
            'description_meta' => 'array',
            'start_date' => 'date',
            'end_date' => 'date',
            'actual_start_date' => 'date',
            'actual_end_date' => 'date',
            'budget' => 'decimal:2',
            'progress_percent' => 'decimal:2',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function lots(): HasMany
    {
        return $this->hasMany(ProjectLot::class)->orderBy('sort_order');
    }

    public function phases(): HasMany
    {
        return $this->hasMany(ProjectPhase::class)->orderBy('sort_order');
    }

    public function workspaceTasks(): HasMany
    {
        return $this->hasMany(WorkspaceTask::class);
    }

    public function teamMembers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user')
            ->withPivot(['role_label', 'assigned_at'])
            ->withTimestamps();
    }

    public function progressSnapshots(): HasMany
    {
        return $this->hasMany(ProgressSnapshot::class)->latest('recorded_at');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
