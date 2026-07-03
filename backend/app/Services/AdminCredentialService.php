<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminCredentialService
{
    public function storeProvisionedPassword(User $user, string $plainPassword): void
    {
        $user->forceFill([
            'provisioned_password' => Crypt::encryptString($plainPassword),
        ])->save();
    }

    public function reveal(User $user): ?string
    {
        if ($user->provisioned_password === null || $user->provisioned_password === '') {
            return null;
        }

        return Crypt::decryptString($user->provisioned_password);
    }

    public function resetAndStore(User $user): string
    {
        $plainPassword = Str::password(12);

        $user->forceFill([
            'password' => Hash::make($plainPassword),
            'provisioned_password' => Crypt::encryptString($plainPassword),
        ])->save();

        return $plainPassword;
    }
}
