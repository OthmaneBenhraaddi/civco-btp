<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\ClientContact\StoreClientContactRequest;
use App\Http\Requests\ClientContact\UpdateClientContactRequest;
use App\Http\Resources\ClientContactResource;
use App\Models\Client;
use App\Models\ClientContact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientContactController extends Controller
{
    use ResolvesCompanyContext;

    public function store(StoreClientContactRequest $request, Client $client): JsonResponse
    {
        $this->ensureClientBelongsToCompany($request, $client);

        $contact = $client->contacts()->create($request->validated());

        return (new ClientContactResource($contact))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateClientContactRequest $request, ClientContact $clientContact): ClientContactResource
    {
        $this->ensureContactBelongsToCompany($request, $clientContact);

        $clientContact->update($request->validated());

        return new ClientContactResource($clientContact->fresh());
    }

    public function destroy(Request $request, ClientContact $clientContact): JsonResponse
    {
        $this->ensureContactBelongsToCompany($request, $clientContact);

        $clientContact->delete();

        return response()->json(['message' => 'Contact deleted.']);
    }

    private function ensureClientBelongsToCompany(Request $request, Client $client): void
    {
        if ($client->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }

    private function ensureContactBelongsToCompany(Request $request, ClientContact $clientContact): void
    {
        $clientContact->loadMissing('client');

        if ($clientContact->client?->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
