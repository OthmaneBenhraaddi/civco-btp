<?php

namespace App\Models;

use App\Enums\DeliveryFormStatus;
use App\Models\Concerns\BelongsToCompany;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryForm extends Model
{
    use BelongsToCompany, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'company_id',
        'client_id',
        'project_id',
        'quote_id',
        'invoice_id',
        'dispatch_note_id',
        'reference',
        'status',
        'generation_count',
        'delivery_date',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'status' => DeliveryFormStatus::class,
            'delivery_date' => 'date',
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

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function dispatchNote(): BelongsTo
    {
        return $this->belongsTo(DispatchNote::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(DeliveryFormLine::class)->orderBy('sort_order');
    }
}
