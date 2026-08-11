<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use App\Models\Concerns\AppliesStealthClientFilter;
use App\Models\Concerns\BelongsToCompany;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Invoice extends Model
{
    use AppliesStealthClientFilter, BelongsToCompany, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'company_id',
        'client_id',
        'project_id',
        'quote_id',
        'dispatch_note_id',
        'reference',
        'status',
        'issued_at',
        'due_date',
        'notes',
        'total_ht',
        'total_tax',
        'total_ttc',
        'amount_paid',
        'balance_due',
        'generation_count',
    ];

    protected function casts(): array
    {
        return [
            'status' => InvoiceStatus::class,
            'issued_at' => 'date',
            'due_date' => 'date',
            'total_ht' => 'decimal:2',
            'total_tax' => 'decimal:2',
            'total_ttc' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'balance_due' => 'decimal:2',
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

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function dispatchNote(): BelongsTo
    {
        return $this->belongsTo(DispatchNote::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InvoiceLine::class)->orderBy('sort_order');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
