<?php

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use App\Models\Badge;
use App\Models\DeliveryForm;
use App\Models\DispatchNote;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\Quote;
use App\Models\Task;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

echo 'Tenants: '.Tenant::count().PHP_EOL;
echo 'Users: '.User::count().PHP_EOL;
echo 'Super Admin role: '.User::where('email', 'superadmin@btp.ma')->value('role').PHP_EOL;

foreach (Tenant::withCount(['clients', 'projects'])->get() as $tenant) {
    echo "{$tenant->subdomain} | {$tenant->name} | clients={$tenant->clients_count} | projects={$tenant->projects_count}".PHP_EOL;
}

echo 'Quotes: '.Quote::count().PHP_EOL;
echo 'Invoices: '.Invoice::count().PHP_EOL;
echo 'Delivery forms: '.DeliveryForm::count().PHP_EOL;
echo 'Dispatch notes: '.DispatchNote::count().PHP_EOL;
echo 'Phases: '.ProjectPhase::count().PHP_EOL;
echo 'Tasks: '.Task::count().PHP_EOL;
echo 'Badges: '.Badge::count().PHP_EOL;
echo 'Projects in_progress: '.Project::where('status', 'in_progress')->count().PHP_EOL;
echo 'Projects completed: '.Project::where('status', 'completed')->count().PHP_EOL;
echo 'Projects cancelled: '.Project::where('status', 'cancelled')->count().PHP_EOL;
