<?php

namespace App\Models;

use App\Enums\ContractStatus;
use App\Models\Concerns\AppliesStealthClientFilter;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\ValidationException;

class Contract extends Model
{
    use AppliesStealthClientFilter, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'project_id',
        'client_id',
        'contract_template_id',
        'title',
        'content',
        'status',
        'client_signed_at',
        'tenant_signed_at',
        'client_signature_data',
        'tenant_signature_data',
        'generation_count',
    ];

    protected function casts(): array
    {
        return [
            'status' => ContractStatus::class,
            'client_signed_at' => 'datetime',
            'tenant_signed_at' => 'datetime',
            'generation_count' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function (Contract $contract): void {
            if ($contract->isDirty('content') && filled($contract->getOriginal('content'))) {
                throw ValidationException::withMessages([
                    'content' => ['Le contrat initial ne peut pas être modifié. Créez un avenant.'],
                ]);
            }
        });

        static::deleting(function (): void {
            throw ValidationException::withMessages([
                'contract' => ['Un contrat initial ne peut pas être supprimé.'],
            ]);
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function amendments(): HasMany
    {
        return $this->hasMany(ContractAmendment::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ContractTemplate::class, 'contract_template_id');
    }
}
