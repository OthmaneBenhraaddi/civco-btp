<?php

namespace App\Models;

use App\Enums\ClientStatus;
use App\Models\Concerns\AppliesStealthClientFilter;
use App\Models\Concerns\BelongsToCompany;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Client extends Model
{
    use AppliesStealthClientFilter, BelongsToCompany, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'company_id',
        'name',
        'contact_name',
        'email',
        'phone',
        'address_line1',
        'address_line2',
        'postal_code',
        'city',
        'country',
        'notes',
        'is_active',
        'is_official',
        'status',
        'archived_at',
        'client_role_slug',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_official' => 'boolean',
            'status' => ClientStatus::class,
            'archived_at' => 'datetime',
        ];
    }

    public function isArchived(): bool
    {
        return ($this->status ?? ClientStatus::Active) === ClientStatus::Archived;
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'badge_client')
            ->withTimestamps();
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(ClientContact::class)->orderBy('name');
    }

    public function portalUser(): HasOne
    {
        return $this->hasOne(User::class);
    }
}
