<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryFormLine extends Model
{
    protected $fillable = [
        'delivery_form_id',
        'quote_line_id',
        'project_phase_id',
        'sort_order',
        'description',
        'quantity',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
        ];
    }

    public function deliveryForm(): BelongsTo
    {
        return $this->belongsTo(DeliveryForm::class);
    }

    public function quoteLine(): BelongsTo
    {
        return $this->belongsTo(QuoteLine::class);
    }

    public function projectPhase(): BelongsTo
    {
        return $this->belongsTo(ProjectPhase::class);
    }
}
