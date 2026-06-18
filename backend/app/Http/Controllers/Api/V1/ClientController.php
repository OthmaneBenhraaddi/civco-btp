<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreClientRequest;
use App\Http\Requests\Client\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Client::query()
            ->forCompany($this->companyId($request))
            ->withCount('projects')
            ->orderBy('name');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return ClientResource::collection(
            $query->paginate($request->integer('per_page', 15))->withQueryString()
        );
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $client = Client::query()->create([
            ...$request->validated(),
            'company_id' => $this->companyId($request),
            'country' => $request->input('country', 'FR'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return (new ClientResource($client))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Client $client): ClientResource
    {
        $this->ensureClientBelongsToCompany($request, $client);

        return new ClientResource($client->loadCount('projects'));
    }

    public function update(UpdateClientRequest $request, Client $client): ClientResource
    {
        $this->ensureClientBelongsToCompany($request, $client);

        $client->update($request->validated());

        return new ClientResource($client->fresh()->loadCount('projects'));
    }

    public function destroy(Request $request, Client $client): JsonResponse
    {
        $this->ensureClientBelongsToCompany($request, $client);

        if ($client->projects()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a client linked to projects.',
            ], 422);
        }

        $client->delete();

        return response()->json(['message' => 'Client deleted.']);
    }

    private function ensureClientBelongsToCompany(Request $request, Client $client): void
    {
        if ($client->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
