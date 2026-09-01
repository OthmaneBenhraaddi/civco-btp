<?php

namespace Database\Seeders;

use App\Support\PlatformSuperAdmin;
use Illuminate\Database\Seeder;

class PlatformSuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $user = PlatformSuperAdmin::seedFromEnvironment();

        $this->command?->info("Platform superadmin ready: {$user->email}");
    }
}
