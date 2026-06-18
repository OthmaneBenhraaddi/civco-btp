<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'company_id',
        'user_id',
        'actor_label',
        'action',
        'entity_type',
        'entity_id',
        'message',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'entity_id' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
