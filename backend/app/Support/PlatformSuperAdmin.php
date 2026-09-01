<?php

namespace App\Support;

use App\Enums\UserStatus;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use RuntimeException;

final class PlatformSuperAdmin
{
    public static function email(): string
    {
        return trim((string) env('SUPERADMIN_EMAIL', 'admin@civco.ma'));
    }

    public static function password(): string
    {
        return (string) env('SUPERADMIN_PASSWORD', 'ChangeThisPassword123!');
    }

    public static function name(): string
    {
        $name = trim((string) env('SUPERADMIN_NAME', 'Super Admin'));

        return $name !== '' ? $name : 'Super Admin';
    }

    public static function find(): ?User
    {
        return User::query()
            ->whereNull('tenant_id')
            ->where('role', 'super_admin')
            ->orderBy('id')
            ->first();
    }

    /**
     * Create or refresh the platform superadmin from environment credentials.
     */
    public static function seedFromEnvironment(): User
    {
        return self::upsert(
            self::email(),
            self::password(),
            self::name(),
        );
    }

    public static function upsert(string $email, string $plainPassword, ?string $fullName = null): User
    {
        $email = strtolower(trim($email));

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw ValidationException::withMessages([
                'email' => ['A valid superadmin email is required.'],
            ]);
        }

        if (trim($plainPassword) === '') {
            throw ValidationException::withMessages([
                'password' => ['A superadmin password is required.'],
            ]);
        }

        $occupant = User::query()->where('email', $email)->first();
        $superAdmin = self::find();

        if ($occupant !== null && ($superAdmin === null || $occupant->id !== $superAdmin->id)) {
            throw new RuntimeException(
                "Cannot assign superadmin email [{$email}] because it already belongs to another account."
            );
        }

        [$firstName, $lastName] = self::splitName($fullName ?? self::name());

        $attributes = [
            'tenant_id' => null,
            'client_id' => null,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'is_active' => true,
            'status' => UserStatus::Active,
            'role' => 'super_admin',
            'job_title' => 'Super Admin',
            'password' => Hash::make($plainPassword),
            'email_verified_at' => now(),
        ];

        if ($superAdmin !== null) {
            $superAdmin->fill($attributes);
            $superAdmin->save();
        } else {
            $superAdmin = User::query()->create($attributes);
        }

        self::ensureRoleAndPermissions($superAdmin);

        return $superAdmin->fresh();
    }

    public static function ensureRoleAndPermissions(User $user): void
    {
        $permissionIds = Permission::query()->orderBy('id')->pluck('id');

        $role = Role::query()->updateOrCreate(
            ['company_id' => null, 'slug' => 'super_admin'],
            [
                'name' => 'Super Admin',
                'description' => 'Full system access',
                'badge_tone' => 'purple',
                'is_system' => true,
            ],
        );

        if ($permissionIds->isNotEmpty()) {
            $role->permissions()->sync($permissionIds->all());
        }

        $user->role = 'super_admin';
        $user->tenant_id = null;
        $user->save();
    }

    /**
     * @return array{0: string, 1: string}
     */
    public static function splitName(string $fullName): array
    {
        $fullName = trim(preg_replace('/\s+/', ' ', $fullName) ?? '');

        if ($fullName === '') {
            return ['Super', 'Admin'];
        }

        $parts = explode(' ', $fullName, 2);

        return [
            $parts[0],
            $parts[1] ?? 'Admin',
        ];
    }
}
