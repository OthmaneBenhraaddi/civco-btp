<?php

namespace App\Models;

use App\Enums\TenantStatus;
use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['first_name', 'last_name', 'email', 'phone', 'cin', 'job_title', 'is_active', 'role', 'password', 'tenant_id', 'client_id', 'status', 'stealth_shortcut'])]
#[Hidden(['password', 'remember_token', 'provisioned_password'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** @var array<int, list<string>> */
    private array $permissionSlugCache = [];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'status' => UserStatus::class,
            'password' => 'hashed',
            'stealth_shortcut' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (User $user): void {
            $user->assertIdentityFieldsPresent();
        });
    }

    /**
     * Shared validation rules for user identity fields.
     *
     * @return array<string, list<mixed>>
     */
    public static function identityFieldRules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100', 'regex:/\S/'],
            'last_name' => ['required', 'string', 'max:100', 'regex:/\S/'],
        ];
    }

    public function assertIdentityFieldsPresent(): void
    {
        $firstName = trim((string) ($this->first_name ?? ''));
        $lastName = trim((string) ($this->last_name ?? ''));

        $errors = [];

        if ($firstName === '') {
            $errors['first_name'] = ['Le prénom est requis.'];
        }

        if ($lastName === '') {
            $errors['last_name'] = ['Le nom est requis.'];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        $this->first_name = $firstName;
        $this->last_name = $lastName;
    }

    public function getFullNameAttribute(): string
    {
        $firstName = trim((string) ($this->attributes['first_name'] ?? ''));
        $lastName = trim((string) ($this->attributes['last_name'] ?? ''));

        return trim("{$firstName} {$lastName}");
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function isClientPortalUser(): bool
    {
        return $this->client_id !== null;
    }

    public function isSuperAdmin(): bool
    {
        return $this->tenant_id === null && $this->role === 'super_admin';
    }

    public function isActive(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        return ($this->status ?? UserStatus::Active) === UserStatus::Active;
    }

    public function canAccessApplication(): bool
    {
        if (! $this->isActive()) {
            return false;
        }

        if ($this->tenant_id === null) {
            return $this->isSuperAdmin();
        }

        $tenant = $this->relationLoaded('tenant') ? $this->tenant : $this->tenant()->first();

        return $tenant !== null && $tenant->status === TenantStatus::Active;
    }

    public function appNotifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'company_user')
            ->withPivot(['is_primary', 'joined_at'])
            ->withTimestamps();
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_role')
            ->withPivot('company_id')
            ->withTimestamps();
    }

    public function rolesForCompany(int $companyId): BelongsToMany
    {
        return $this->roles()->wherePivot('company_id', $companyId);
    }

    public function primaryCompany(): ?Company
    {
        return $this->companies()
            ->wherePivot('is_primary', true)
            ->first()
            ?? $this->companies()->first();
    }

    public function permissionSlugsForCompany(int $companyId): array
    {
        if (isset($this->permissionSlugCache[$companyId])) {
            return $this->permissionSlugCache[$companyId];
        }

        $slugs = DB::table('permissions')
            ->join('role_permission', 'permissions.id', '=', 'role_permission.permission_id')
            ->join('user_role', 'role_permission.role_id', '=', 'user_role.role_id')
            ->where('user_role.user_id', $this->id)
            ->where('user_role.company_id', $companyId)
            ->distinct()
            ->orderBy('permissions.slug')
            ->pluck('permissions.slug')
            ->all();

        $this->permissionSlugCache[$companyId] = $slugs;

        return $slugs;
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function assignedProjects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user')
            ->withPivot(['role_label', 'assigned_at', 'can_chat_with_client'])
            ->withTimestamps();
    }
}
