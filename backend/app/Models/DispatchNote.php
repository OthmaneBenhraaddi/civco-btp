<?php

namespace App\Models;

use App\Enums\DispatchNoteStatus;
use App\Models\Concerns\AppliesStealthClientFilter;
use App\Models\Concerns\BelongsToCompany;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DispatchNote extends Model
{
    use AppliesStealthClientFilter, BelongsToCompany, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'company_id',
        'client_id',
        'reference_number',
        'status',
        'executed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => DispatchNoteStatus::class,
            'executed_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function deliveryForms(): HasMany
    {
        return $this->hasMany(DeliveryForm::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function isExecuted(): bool
    {
        return $this->status === DispatchNoteStatus::Executed;
    }
}
