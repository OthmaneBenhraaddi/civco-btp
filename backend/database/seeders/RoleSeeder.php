<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $allPermissions = Permission::query()->pluck('id', 'slug');

        $roles = [
            'admin' => [
                'name' => 'Administrateur',
                'description' => 'Full access within the company',
                'badge_tone' => 'purple',
                'permissions' => $allPermissions->keys()->all(),
            ],
            'project_manager' => [
                'name' => 'Chef de projet',
                'description' => 'Project planning and tracking',
                'badge_tone' => 'sky',
                'permissions' => [
                    'dashboard.view', 'client.view', 'project.view', 'project.create', 'project.update',
                    'document.view', 'document.upload', 'document.archive', 'expense.view', 'expense.manage',
                    'quote.view', 'invoice.view', 'delivery_form.view',
                ],
            ],
            'commercial' => [
                'name' => 'Commercial',
                'description' => 'Clients and commercial documents',
                'badge_tone' => 'amber',
                'permissions' => [
                    'dashboard.view', 'client.view', 'client.create', 'client.update',
                    'project.view', 'quote.view', 'quote.manage', 'delivery_form.view', 'delivery_form.manage', 'invoice.view', 'invoice.manage',
                    'document.view', 'document.upload',
                ],
            ],
            'accountant' => [
                'name' => 'Comptable',
                'description' => 'Billing and financial operations',
                'badge_tone' => 'emerald',
                'permissions' => [
                    'dashboard.view', 'client.view', 'project.view',
                    'quote.view', 'invoice.view', 'invoice.manage', 'payment.record', 'delivery_form.view',
                    'expense.view', 'expense.manage', 'document.view', 'document.upload', 'document.archive',
                ],
            ],
            'collaborator' => [
                'name' => 'Collaborateur',
                'description' => 'Operational access on assigned work',
                'badge_tone' => 'slate',
                'permissions' => [
                    'dashboard.view', 'project.view', 'project.update',
                    'document.view', 'document.upload',
                ],
            ],
            'super_admin' => [
                'name' => 'Super Admin',
                'description' => 'Full system access (UI mock role)',
                'badge_tone' => 'purple',
                'permissions' => $allPermissions->keys()->all(),
            ],
            'chef_chantier' => [
                'name' => 'Chef de chantier',
                'description' => 'Site manager (UI mock role)',
                'badge_tone' => 'amber',
                'permissions' => [
                    'dashboard.view', 'project.view', 'project.update', 'task.view_all', 'task.update',
                ],
            ],
            'conducteur_travaux' => [
                'name' => 'Conducteur de travaux',
                'description' => 'Works supervisor (UI mock role)',
                'badge_tone' => 'sky',
                'permissions' => [
                    'dashboard.view', 'project.view', 'project.update', 'task.view_all',
                ],
            ],
            'client_extern' => [
                'name' => 'Client externe',
                'description' => 'External client portal role (UI mock role)',
                'badge_tone' => 'slate',
                'permissions' => ['client.view', 'project.view'],
            ],
        ];

        foreach ($roles as $slug => $definition) {
            $role = Role::query()->updateOrCreate(
                ['company_id' => null, 'slug' => $slug],
                [
                    'name' => $definition['name'],
                    'description' => $definition['description'],
                    'badge_tone' => $definition['badge_tone'] ?? 'slate',
                    'is_system' => true,
                ],
            );

            $permissionIds = collect($definition['permissions'])
                ->map(fn (string $slug) => $allPermissions[$slug] ?? null)
                ->filter()
                ->values()
                ->all();

            $role->permissions()->sync($permissionIds);
        }
    }
}
