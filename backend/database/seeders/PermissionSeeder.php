<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'View dashboard', 'slug' => 'dashboard.view', 'module' => 'dashboard'],
            ['name' => 'View users', 'slug' => 'user.view', 'module' => 'user'],
            ['name' => 'Create users', 'slug' => 'user.create', 'module' => 'user'],
            ['name' => 'Update users', 'slug' => 'user.update', 'module' => 'user'],
            ['name' => 'Delete users', 'slug' => 'user.delete', 'module' => 'user'],
            ['name' => 'View roles', 'slug' => 'role.view', 'module' => 'role'],
            ['name' => 'Manage roles', 'slug' => 'role.manage', 'module' => 'role'],
            ['name' => 'View companies', 'slug' => 'company.view', 'module' => 'company'],
            ['name' => 'Manage companies', 'slug' => 'company.manage', 'module' => 'company'],
            ['name' => 'View clients', 'slug' => 'client.view', 'module' => 'client'],
            ['name' => 'Create clients', 'slug' => 'client.create', 'module' => 'client'],
            ['name' => 'Update clients', 'slug' => 'client.update', 'module' => 'client'],
            ['name' => 'Delete clients', 'slug' => 'client.delete', 'module' => 'client'],
            ['name' => 'View projects', 'slug' => 'project.view', 'module' => 'project'],
            ['name' => 'Create projects', 'slug' => 'project.create', 'module' => 'project'],
            ['name' => 'Update projects', 'slug' => 'project.update', 'module' => 'project'],
            ['name' => 'Delete projects', 'slug' => 'project.delete', 'module' => 'project'],
            ['name' => 'View documents', 'slug' => 'document.view', 'module' => 'document'],
            ['name' => 'Upload documents', 'slug' => 'document.upload', 'module' => 'document'],
            ['name' => 'Archive documents', 'slug' => 'document.archive', 'module' => 'document'],
            ['name' => 'View quotes', 'slug' => 'quote.view', 'module' => 'quote'],
            ['name' => 'Manage quotes', 'slug' => 'quote.manage', 'module' => 'quote'],
            ['name' => 'View delivery forms', 'slug' => 'delivery_form.view', 'module' => 'delivery_form'],
            ['name' => 'Manage delivery forms', 'slug' => 'delivery_form.manage', 'module' => 'delivery_form'],
            ['name' => 'View invoices', 'slug' => 'invoice.view', 'module' => 'invoice'],
            ['name' => 'Manage invoices', 'slug' => 'invoice.manage', 'module' => 'invoice'],
            ['name' => 'Record payments', 'slug' => 'payment.record', 'module' => 'payment'],
            ['name' => 'View expenses', 'slug' => 'expense.view', 'module' => 'expense'],
            ['name' => 'Manage expenses', 'slug' => 'expense.manage', 'module' => 'expense'],
            ['name' => 'View all tasks', 'slug' => 'task.view_all', 'module' => 'task'],
            ['name' => 'View own tasks', 'slug' => 'task.view_own', 'module' => 'task'],
            ['name' => 'Assign tasks', 'slug' => 'task.assign', 'module' => 'task'],
            ['name' => 'Update tasks', 'slug' => 'task.update', 'module' => 'task'],
            ['name' => 'View project budget', 'slug' => 'project.budget', 'module' => 'project'],
            ['name' => 'View financials (read-only)', 'slug' => 'view_financials', 'module' => 'financials'],
            ['name' => 'Manage financials', 'slug' => 'manage_financials', 'module' => 'financials'],
            ['name' => 'Manage tasks', 'slug' => 'manage_tasks', 'module' => 'task'],
            ['name' => 'View clients (semantic)', 'slug' => 'view_clients', 'module' => 'client'],
            ['name' => 'Edit clients (semantic)', 'slug' => 'edit_clients', 'module' => 'client'],
            ['name' => 'Manage projects (semantic)', 'slug' => 'manage_projects', 'module' => 'project'],
            ['name' => 'View tickets', 'slug' => 'ticket.view', 'module' => 'ticket'],
            ['name' => 'Create tickets', 'slug' => 'ticket.create', 'module' => 'ticket'],
            ['name' => 'Reply to tickets', 'slug' => 'ticket.reply', 'module' => 'ticket'],
            ['name' => 'Close tickets', 'slug' => 'ticket.close', 'module' => 'ticket'],
        ];

        foreach ($permissions as $permission) {
            Permission::query()->updateOrCreate(
                ['slug' => $permission['slug']],
                $permission,
            );
        }
    }
}
