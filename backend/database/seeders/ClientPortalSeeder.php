<?php

namespace Database\Seeders;

use App\Enums\QuoteStatus;
use App\Models\Client;
use App\Models\Company;
use App\Models\Project;
use App\Models\ProjectComment;
use App\Models\ProjectMedia;
use App\Models\Quote;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ClientPortalSeeder extends Seeder
{
    public function run(): void
    {
        $client = Client::query()->where('email', 'karim.benjelloun@alomrane.ma')->first()
            ?? Client::query()->first();

        if ($client === null) {
            return;
        }

        $company = Company::query()->first();

        $clientUser = User::query()->updateOrCreate(
            ['email' => 'client.portal@civco-btp.ma'],
            [
                'tenant_id' => $client->tenant_id,
                'first_name' => 'Fatima',
                'last_name' => 'Bennani',
                'phone' => '+212600000099',
                'password' => Hash::make('password'),
                'is_active' => true,
                'role' => 'user',
                'client_id' => $client->id,
                'email_verified_at' => now(),
            ],
        );

        if ($company !== null) {
            $company->users()->syncWithoutDetaching([
                $clientUser->id => [
                    'is_primary' => true,
                    'joined_at' => now()->toDateString(),
                ],
            ]);

            $clientRole = Role::query()->where('slug', 'client_extern')->whereNull('company_id')->first();

            if ($clientRole !== null) {
                $clientUser->roles()->syncWithoutDetaching([
                    $clientRole->id => ['company_id' => $company->id],
                ]);
            }
        }

        $project = Project::query()
            ->where('client_id', $client->id)
            ->whereIn('status', ['planned', 'in_progress', 'on_hold'])
            ->first()
            ?? Project::query()->where('client_id', $client->id)->first();

        if ($project === null) {
            return;
        }

        $phase = $project->phases()->first();

        if ($phase !== null) {
            Task::query()->firstOrCreate(
                [
                    'project_phase_id' => $phase->id,
                    'title' => 'Coulage dalle étage 5',
                ],
                [
                    'tenant_id' => $project->tenant_id,
                    'status' => 'todo',
                    'due_date' => now()->addDays(2)->toDateString(),
                    'progress_percent' => 0,
                    'sort_order' => 1,
                ],
            );
        }

        ProjectMedia::query()->firstOrCreate(
            [
                'project_id' => $project->id,
                'title' => 'Mur n°4 Étage 5 fini',
            ],
            [
                'tenant_id' => $project->tenant_id,
                'uploaded_by_user_id' => User::query()->where('role', 'admin')->value('id'),
                'image_path' => 'project-media/demo/chantier-etage-5.jpg',
            ],
        );

        ProjectComment::query()->firstOrCreate(
            [
                'project_id' => $project->id,
                'user_id' => $clientUser->id,
                'content' => 'Merci pour la mise à jour, le mur de la cage d\'escalier est conforme.',
            ],
            [
                'tenant_id' => $project->tenant_id,
            ],
        );

        Quote::query()->firstOrCreate(
            [
                'company_id' => $client->company_id,
                'reference' => 'DEV-PORTAL-001',
            ],
            [
                'tenant_id' => $client->tenant_id,
                'client_id' => $client->id,
                'project_id' => $project->id,
                'status' => QuoteStatus::Sent,
                'issued_at' => now()->toDateString(),
                'valid_until' => now()->addMonth()->toDateString(),
                'notes' => 'Devis de démonstration — en attente de signature client.',
                'total_ht' => 150_000,
                'total_tax' => 30_000,
                'total_ttc' => 180_000,
            ],
        );
    }
}
