<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\ProjectStatus;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Project;
use Illuminate\Support\Collection;

class DashboardService
{
    public function summaryForCompany(int $companyId): array
    {
        $projects = Project::query()
            ->forCompany($companyId)
            ->with('client:id,name')
            ->get();

        $byStatus = $projects->groupBy(fn (Project $project) => $project->status->value)
            ->map(fn (Collection $group) => $group->count())
            ->all();

        $activeProjects = $projects->filter(
            fn (Project $project) => in_array($project->status, [
                ProjectStatus::Planned,
                ProjectStatus::InProgress,
                ProjectStatus::OnHold,
            ], true),
        );

        $averageProgress = $activeProjects->isEmpty()
            ? 0
            : round((float) $activeProjects->avg('progress_percent'), 2);

        $recentProjects = Project::query()
            ->forCompany($companyId)
            ->with('client:id,name')
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'reference' => $project->reference,
                'title' => $project->title,
                'status' => $project->status->value,
                'progress_percent' => (float) $project->progress_percent,
                'client_name' => $project->client?->name,
            ])
            ->values()
            ->all();

        $totalRevenue = (float) Invoice::query()
            ->forCompany($companyId)
            ->sum('amount_paid');

        $outstandingBalance = (float) Invoice::query()
            ->forCompany($companyId)
            ->whereNotIn('status', [
                InvoiceStatus::Paid->value,
                InvoiceStatus::Cancelled->value,
                InvoiceStatus::Draft->value,
            ])
            ->sum('balance_due');

        $overdueInvoicesCount = Invoice::query()
            ->forCompany($companyId)
            ->where('balance_due', '>', 0)
            ->whereDate('due_date', '<', now()->toDateString())
            ->whereNotIn('status', [
                InvoiceStatus::Paid->value,
                InvoiceStatus::Cancelled->value,
            ])
            ->count();

        $totalExpenses = (float) Expense::query()
            ->whereHas('project', fn ($query) => $query->where('company_id', $companyId))
            ->sum('amount');

        return [
            'projects' => [
                'total' => $projects->count(),
                'by_status' => $byStatus,
                'active_count' => $activeProjects->count(),
                'average_progress' => $averageProgress,
            ],
            'financial' => [
                'total_revenue' => $totalRevenue,
                'outstanding_balance' => $outstandingBalance,
                'overdue_invoices_count' => $overdueInvoicesCount,
                'total_expenses' => $totalExpenses,
            ],
            'recent_projects' => $recentProjects,
        ];
    }
}
