<?php

namespace Database\Seeders;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PlatformSuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'superadmin@btp.ma'],
            [
                'tenant_id' => null,
                'first_name' => 'Super',
                'last_name' => 'Administrateur',
                'phone' => '+212 600 000 000',
                'is_active' => true,
                'status' => UserStatus::Active,
                'role' => 'super_admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );
    }
}
