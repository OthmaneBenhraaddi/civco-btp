<?php

namespace App\Models;

use App\Enums\ContractStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contract extends Model
{
    use BelongsToTenant;

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

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
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
