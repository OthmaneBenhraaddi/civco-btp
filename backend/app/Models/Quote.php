<?php

namespace App\Models;

use App\Enums\QuoteStatus;
use App\Models\Concerns\AppliesStealthClientFilter;
use App\Models\Concerns\BelongsToCompany;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Quote extends Model
{
    use AppliesStealthClientFilter, BelongsToCompany, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'company_id',
        'client_id',
        'project_id',
        'reference',
        'status',
        'issued_at',
        'valid_until',
        'notes',
        'client_signature_data',
        'client_signed_at',
        'total_ht',
        'total_tax',
        'total_ttc',
        'generation_count',
    ];

    protected function casts(): array
    {
        return [
            'status' => QuoteStatus::class,
            'issued_at' => 'date',
            'valid_until' => 'date',
            'client_signed_at' => 'datetime',
            'total_ht' => 'decimal:2',
            'total_tax' => 'decimal:2',
            'total_ttc' => 'decimal:2',
            'generation_count' => 'integer',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(QuoteLine::class)->orderBy('sort_order');
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    public function deliveryForms(): HasMany
    {
        return $this->hasMany(DeliveryForm::class);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
