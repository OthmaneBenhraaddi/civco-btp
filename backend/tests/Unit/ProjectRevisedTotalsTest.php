<?php

namespace Tests\Unit;

use App\Enums\ContractAmendmentStatus;
use App\Enums\ContractAmendmentType;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectRevisedTotalsTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_validated_amendments_are_included_in_revised_totals(): void
    {
        $this->seed();

        $project = Project::query()->whereNotNull('budget')->whereNotNull('end_date')->firstOrFail();
        $initialBudget = (float) $project->budget;
        $initialEnd = $project->end_date->toDateString();

        $project->amendments()->create([
            'tenant_id' => $project->tenant_id,
            'title' => 'Draft ignored',
            'type' => ContractAmendmentType::Budget,
            'status' => ContractAmendmentStatus::Draft,
            'amount_change' => 999999,
            'duration_change_days' => 90,
        ]);

        $project->amendments()->create([
            'tenant_id' => $project->tenant_id,
            'title' => 'Validated applied',
            'type' => ContractAmendmentType::Mixed,
            'status' => ContractAmendmentStatus::Validated,
            'amount_change' => 10000,
            'duration_change_days' => 5,
        ]);

        $project->unsetRelation('amendments');
        $project->load('amendments');

        $this->assertEqualsWithDelta($initialBudget + 10000, $project->revised_budget, 0.01);
        $this->assertSame(
            $project->end_date->copy()->addDays(5)->toDateString(),
            $project->revised_end_date,
        );
        $this->assertSame($initialEnd, $project->end_date->toDateString());
        $this->assertEqualsWithDelta($initialBudget, (float) $project->budget, 0.01);
    }
}
