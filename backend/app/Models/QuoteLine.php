<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuoteLine extends Model
{
    protected $fillable = [
        'quote_id',
        'sort_order',
        'description',
        'quantity',
        'unit_price_ht',
        'tax_rate',
        'line_total_ht',
        'line_total_tax',
        'line_total_ttc',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'unit_price_ht' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'line_total_ht' => 'decimal:2',
            'line_total_tax' => 'decimal:2',
            'line_total_ttc' => 'decimal:2',
        ];
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }
}
