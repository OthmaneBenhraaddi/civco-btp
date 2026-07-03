<?php

namespace App\Models;

use App\Enums\TenantStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'subdomain',
        'logo_path',
        'status',
        'max_official_prints',
        'max_official_devis',
        'max_official_invoices',
        'max_official_delivery_forms',
        'max_official_contracts',
    ];

    protected function casts(): array
    {
        return [
            'status' => TenantStatus::class,
            'max_official_prints' => 'integer',
            'max_official_devis' => 'integer',
            'max_official_invoices' => 'integer',
            'max_official_delivery_forms' => 'integer',
            'max_official_contracts' => 'integer',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function admins(): HasMany
    {
        return $this->users()->where('role', 'admin');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
