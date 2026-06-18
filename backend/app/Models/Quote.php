<?php

namespace App\Models;

use App\Enums\QuoteStatus;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Quote extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'client_id',
        'project_id',
        'reference',
        'status',
        'issued_at',
        'valid_until',
        'notes',
        'total_ht',
        'total_tax',
        'total_ttc',
    ];

    protected function casts(): array
    {
        return [
            'status' => QuoteStatus::class,
            'issued_at' => 'date',
            'valid_until' => 'date',
            'total_ht' => 'decimal:2',
            'total_tax' => 'decimal:2',
            'total_ttc' => 'decimal:2',
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

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
