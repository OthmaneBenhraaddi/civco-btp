<?php

namespace App\Models;

use App\Enums\ContractAmendmentStatus;
use App\Enums\ContractAmendmentType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ContractAmendment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'project_id',
        'contract_id',
        'title',
        'type',
        'status',
        'amount_change',
        'duration_change_days',
        'description',
        'file_path',
        'original_filename',
        'created_by_user_id',
        'submitted_at',
        'validated_at',
        'refused_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => ContractAmendmentType::class,
            'status' => ContractAmendmentStatus::class,
            'amount_change' => 'decimal:2',
            'duration_change_days' => 'integer',
            'submitted_at' => 'datetime',
            'validated_at' => 'datetime',
            'refused_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function scopeValidated(Builder $query): Builder
    {
        return $query->where('status', ContractAmendmentStatus::Validated);
    }

    public function scopePendingClient(Builder $query): Builder
    {
        return $query->where('status', ContractAmendmentStatus::PendingClient);
    }

    public function scopeVisibleToClient(Builder $query): Builder
    {
        return $query->whereIn('status', [
            ContractAmendmentStatus::PendingClient,
            ContractAmendmentStatus::Validated,
            ContractAmendmentStatus::Refused,
        ]);
    }

    public function isValidated(): bool
    {
        return $this->status === ContractAmendmentStatus::Validated;
    }

    public function isMutable(): bool
    {
        return ($this->status ?? ContractAmendmentStatus::Draft)->isMutable();
    }

    public function hasFile(): bool
    {
        return filled($this->file_path);
    }

    public function deleteStoredFile(): void
    {
        if ($this->file_path && Storage::disk('local')->exists($this->file_path)) {
            Storage::disk('local')->delete($this->file_path);
        }
    }
}
