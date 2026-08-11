<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** @var list<string> */
    private array $demoEmails = [
        'admin@btpdemo.fr',
        'yassine.mansouri@civco-btp.ma',
        'amine.alami@civco-btp.ma',
    ];

    public function up(): void
    {
        $tenantId = Tenant::query()
            ->where('subdomain', 'civco')
            ->value('id');

        if ($tenantId === null) {
            $tenantId = Tenant::query()->orderBy('id')->value('id');
        }

        if ($tenantId === null) {
            return;
        }

        User::query()
            ->whereIn('email', $this->demoEmails)
            ->whereNull('tenant_id')
            ->update(['tenant_id' => $tenantId]);

        User::query()
            ->whereIn('email', $this->demoEmails)
            ->where('role', 'super_admin')
            ->update(['role' => 'user']);
    }

    public function down(): void
    {
        // Non réversible sans risque de réassigner de mauvais tenant_id.
    }
};
