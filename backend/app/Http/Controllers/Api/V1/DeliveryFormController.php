<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\DeliveryFormStatus;
use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\DeliveryForm\StoreDeliveryFormRequest;
use App\Http\Requests\DeliveryForm\UpdateDeliveryFormRequest;
use App\Http\Resources\DeliveryFormResource;
use App\Models\Client;
use App\Models\DeliveryForm;
use App\Models\Project;
use App\Services\DeliveryFormReferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class DeliveryFormController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly DeliveryFormReferenceService $referenceService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = DeliveryForm::query()
            ->forCompany($this->companyId($request))
            ->with(['client', 'project'])
            ->orderByDesc('created_at');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('reference', 'like', "%{$search}%")
                    ->orWhereHas('client', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('project', fn ($q) => $q->where('title', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->integer('client_id'));
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        return DeliveryFormResource::collection(
            $query->paginate($request->integer('per_page', 15))->withQueryString()
        );
    }

    public function store(StoreDeliveryFormRequest $request): JsonResponse
    {
        $companyId = $this->companyId($request);
        $validated = $request->validated();
        $lines = $validated['lines'];
        unset($validated['lines']);

        $this->ensureClientBelongsToCompany($request, $request->integer('client_id'));

        if ($request->filled('project_id')) {
            $this->ensureProjectBelongsToCompany($request, $request->integer('project_id'));
        }

        $deliveryForm = DB::transaction(function () use ($companyId, $validated, $lines): DeliveryForm {
            $deliveryForm = DeliveryForm::query()->create([
                ...$validated,
                'company_id' => $companyId,
                'reference' => $this->referenceService->nextForCompany($companyId),
                'status' => DeliveryFormStatus::Draft,
                'delivery_date' => $validated['delivery_date'] ?? now()->toDateString(),
            ]);

            foreach (array_values($lines) as $index => $line) {
                $deliveryForm->lines()->create([
                    'sort_order' => $index + 1,
                    'description' => $line['description'],
                    'quantity' => $line['quantity'],
                    'quote_line_id' => $line['quote_line_id'] ?? null,
                    'project_phase_id' => $line['project_phase_id'] ?? null,
                ]);
            }

            return $deliveryForm;
        });

        return (new DeliveryFormResource($deliveryForm->load(['client', 'project', 'quote', 'lines'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, DeliveryForm $deliveryForm): DeliveryFormResource
    {
        $this->ensureDeliveryFormBelongsToCompany($request, $deliveryForm);

        return new DeliveryFormResource(
            $deliveryForm->load(['client', 'project', 'quote', 'invoice', 'lines.projectPhase'])
        );
    }

    public function update(UpdateDeliveryFormRequest $request, DeliveryForm $deliveryForm): DeliveryFormResource|JsonResponse
    {
        $this->ensureDeliveryFormBelongsToCompany($request, $deliveryForm);

        if ($deliveryForm->status === DeliveryFormStatus::Invoiced) {
            return response()->json([
                'message' => 'Invoiced delivery forms cannot be modified.',
            ], 422);
        }

        $validated = $request->validated();
        $lines = $validated['lines'] ?? null;
        unset($validated['lines']);

        if ($request->filled('client_id')) {
            $this->ensureClientBelongsToCompany($request, $request->integer('client_id'));
        }

        if ($request->filled('project_id')) {
            $this->ensureProjectBelongsToCompany($request, $request->integer('project_id'));
        }

        DB::transaction(function () use ($deliveryForm, $validated, $lines): void {
            $deliveryForm->update($validated);

            if (is_array($lines) && $deliveryForm->status === DeliveryFormStatus::Draft) {
                $deliveryForm->lines()->delete();

                foreach (array_values($lines) as $index => $line) {
                    $deliveryForm->lines()->create([
                        'sort_order' => $index + 1,
                        'description' => $line['description'],
                        'quantity' => $line['quantity'],
                        'quote_line_id' => $line['quote_line_id'] ?? null,
                        'project_phase_id' => $line['project_phase_id'] ?? null,
                    ]);
                }
            }
        });

        return new DeliveryFormResource(
            $deliveryForm->fresh()->load(['client', 'project', 'quote', 'invoice', 'lines.projectPhase'])
        );
    }

    public function destroy(Request $request, DeliveryForm $deliveryForm): JsonResponse
    {
        $this->ensureDeliveryFormBelongsToCompany($request, $deliveryForm);

        if ($deliveryForm->status !== DeliveryFormStatus::Draft) {
            return response()->json([
                'message' => 'Only draft delivery forms can be deleted.',
            ], 422);
        }

        $deliveryForm->lines()->delete();
        $deliveryForm->delete();

        return response()->json(['message' => 'Delivery form deleted.']);
    }

    private function ensureDeliveryFormBelongsToCompany(Request $request, DeliveryForm $deliveryForm): void
    {
        if ($deliveryForm->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }

    private function ensureClientBelongsToCompany(Request $request, int $clientId): void
    {
        $exists = Client::query()
            ->forCompany($this->companyId($request))
            ->whereKey($clientId)
            ->exists();

        if (! $exists) {
            abort(404);
        }
    }

    private function ensureProjectBelongsToCompany(Request $request, int $projectId): void
    {
        $exists = Project::query()
            ->forCompany($this->companyId($request))
            ->whereKey($projectId)
            ->exists();

        if (! $exists) {
            abort(404);
        }
    }
}
