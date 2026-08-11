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
        'custom_domain',
        'logo_path',
        'mail_from_address',
        'mail_host',
        'mail_port',
        'mail_username',
        'mail_password',
        'mail_encryption',
        'status',
        'max_official_prints',
        'max_official_devis',
        'max_official_invoices',
        'max_official_delivery_forms',
        'max_official_contracts',
        'max_official_devis_with_header',
        'max_official_devis_without_header',
        'max_official_invoices_with_header',
        'max_official_invoices_without_header',
        'max_official_delivery_forms_with_header',
        'max_official_delivery_forms_without_header',
        'max_official_contracts_with_header',
        'max_official_contracts_without_header',
        'official_docs_with_header_count',
        'official_docs_without_header_count',
    ];

    protected $hidden = [
        'mail_password',
    ];

    protected function casts(): array
    {
        return [
            'status' => TenantStatus::class,
            'mail_port' => 'integer',
            'mail_password' => 'encrypted',
            'max_official_prints' => 'integer',
            'max_official_devis' => 'integer',
            'max_official_invoices' => 'integer',
            'max_official_delivery_forms' => 'integer',
            'max_official_contracts' => 'integer',
            'max_official_devis_with_header' => 'integer',
            'max_official_devis_without_header' => 'integer',
            'max_official_invoices_with_header' => 'integer',
            'max_official_invoices_without_header' => 'integer',
            'max_official_delivery_forms_with_header' => 'integer',
            'max_official_delivery_forms_without_header' => 'integer',
            'max_official_contracts_with_header' => 'integer',
            'max_official_contracts_without_header' => 'integer',
            'official_docs_with_header_count' => 'integer',
            'official_docs_without_header_count' => 'integer',
        ];
    }

    public function hasCustomSmtp(): bool
    {
        return filled($this->mail_host)
            && filled($this->mail_username)
            && filled($this->mail_password);
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
