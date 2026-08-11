<?php

namespace App\Models;

use App\Enums\ContractAmendmentStatus;
use App\Enums\ProjectStatus;
use App\Models\Concerns\AppliesStealthClientFilter;
use App\Models\Concerns\BelongsToCompany;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Project extends Model
{
    use AppliesStealthClientFilter, BelongsToCompany, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
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
        'site_address',
        'latitude',
        'longitude',
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
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function lots(): BelongsToMany
    {
        return $this->belongsToMany(Lot::class, 'lot_project')
            ->withTimestamps();
    }

    public function legacyLots(): HasMany
    {
        return $this->hasMany(ProjectLot::class)->orderBy('sort_order');
    }

    public function phases(): HasMany
    {
        return $this->hasMany(ProjectPhase::class)->orderBy('sort_order');
    }

    public function teamMembers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user')
            ->withPivot(['role_label', 'assigned_at', 'can_chat_with_client'])
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

    public function comments(): HasMany
    {
        return $this->hasMany(ProjectComment::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(ProjectMedia::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function amendments(): HasMany
    {
        return $this->hasMany(ContractAmendment::class)->latest();
    }

    public function validatedAmendments(): HasMany
    {
        return $this->hasMany(ContractAmendment::class)->validated();
    }

    public function getTotalBudgetAttribute(): ?float
    {
        $delta = $this->amendments_amount_delta;

        if ($this->budget === null && abs($delta) < 0.00001) {
            return null;
        }

        return round((float) ($this->budget ?? 0) + $delta, 2);
    }

    public function getRevisedBudgetAttribute(): ?float
    {
        return $this->total_budget;
    }

    public function getAdjustedEndDateAttribute(): ?string
    {
        if ($this->end_date === null) {
            return null;
        }

        return $this->end_date->copy()->addDays($this->amendments_duration_delta)->toDateString();
    }

    public function getRevisedEndDateAttribute(): ?string
    {
        return $this->adjusted_end_date;
    }

    public function getAmendmentsAmountDeltaAttribute(): float
    {
        if (array_key_exists('amendments_amount_delta_sum', $this->attributes)) {
            return round((float) ($this->attributes['amendments_amount_delta_sum'] ?? 0), 2);
        }

        return round((float) $this->validatedAmendmentsForTotals()->sum('amount_change'), 2);
    }

    public function getAmendmentsDurationDeltaAttribute(): int
    {
        if (array_key_exists('amendments_duration_delta_sum', $this->attributes)) {
            return (int) ($this->attributes['amendments_duration_delta_sum'] ?? 0);
        }

        return (int) $this->validatedAmendmentsForTotals()->sum('duration_change_days');
    }

    /**
     * @return \Illuminate\Support\Collection<int, ContractAmendment>
     */
    private function validatedAmendmentsForTotals()
    {
        if ($this->relationLoaded('amendments')) {
            return $this->amendments->filter(
                fn (ContractAmendment $amendment) => $amendment->status === ContractAmendmentStatus::Validated,
            );
        }

        if ($this->relationLoaded('validatedAmendments')) {
            return $this->validatedAmendments;
        }

        // List endpoints omit aggregates — avoid N+1 lazy sum queries.
        return collect();
    }

    public function formattedSiteAddress(): ?string
    {
        if ($this->site_address) {
            return $this->site_address;
        }

        $parts = array_filter([
            $this->site_address_line1,
            trim(implode(' ', array_filter([$this->site_postal_code, $this->site_city]))),
        ]);

        return $parts === [] ? null : implode(', ', $parts);
    }
}
