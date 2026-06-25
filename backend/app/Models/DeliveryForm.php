<?php

namespace App\Models;

use App\Enums\DeliveryFormStatus;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryForm extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'client_id',
        'project_id',
        'quote_id',
        'invoice_id',
        'reference',
        'status',
        'delivery_date',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'status' => DeliveryFormStatus::class,
            'delivery_date' => 'date',
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

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(DeliveryFormLine::class)->orderBy('sort_order');
    }
}
