<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Requests\Expense\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request, Project $project): AnonymousResourceCollection
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $expenses = $project->expenses()
            ->with('recordedBy')
            ->orderByDesc('expense_date')
            ->get();

        return ExpenseResource::collection($expenses);
    }

    public function store(StoreExpenseRequest $request, Project $project): JsonResponse
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $expense = $project->expenses()->create([
            ...$request->validated(),
            'recorded_by_user_id' => $request->user()->id,
        ]);

        return (new ExpenseResource($expense->load('recordedBy')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): ExpenseResource
    {
        $this->ensureExpenseBelongsToCompany($request, $expense);

        $expense->update($request->validated());

        return new ExpenseResource($expense->fresh()->load('recordedBy'));
    }

    public function destroy(Request $request, Expense $expense): JsonResponse
    {
        $this->ensureExpenseBelongsToCompany($request, $expense);

        $expense->delete();

        return response()->json(['message' => 'Expense deleted.']);
    }

    private function ensureProjectBelongsToCompany(Request $request, Project $project): void
    {
        if ($project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }

    private function ensureExpenseBelongsToCompany(Request $request, Expense $expense): void
    {
        $expense->loadMissing('project');

        if ($expense->project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
