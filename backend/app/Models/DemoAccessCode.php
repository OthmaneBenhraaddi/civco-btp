<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemoAccessCode extends Model
{
    protected $fillable = [
        'code',
        'duration_hours',
        'expires_at',
        'is_used',
        'used_at',
        'created_by_user_id',
        'used_by_user_id',
        'demo_tenant_id',
    ];

    protected function casts(): array
    {
        return [
            'duration_hours' => 'integer',
            'expires_at' => 'datetime',
            'is_used' => 'boolean',
            'used_at' => 'datetime',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function usedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'used_by_user_id');
    }

    public function demoTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'demo_tenant_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isRedeemable(): bool
    {
        return ! $this->is_used && ! $this->isExpired();
    }
}
