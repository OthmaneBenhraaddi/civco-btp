<?php

namespace App\Console\Commands;

use App\Services\DemoAccessService;
use Illuminate\Console\Command;

class PurgeExpiredDemosCommand extends Command
{
    protected $signature = 'demo:purge-expired';

    protected $description = 'Purge expired/unused demo access codes and disposable demo tenants';

    public function handle(DemoAccessService $demoAccess): int
    {
        $result = $demoAccess->purgeExpired();

        $this->info("Codes deleted: {$result['codes_deleted']}");
        $this->info("Demo tenants deleted: {$result['tenants_deleted']}");

        return self::SUCCESS;
    }
}
