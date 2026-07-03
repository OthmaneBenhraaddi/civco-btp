<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Client;
use App\Models\ClientContact;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;

trait ResolvesClientPortalAccess
{
    protected function resolveClientForUser(Request $request): Client
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        if ($user->client_id !== null) {
            return Client::query()->findOrFail($user->client_id);
        }

        $client = Client::query()
            ->where('email', $user->email)
            ->first();

        if ($client !== null) {
            return $client;
        }

        $contact = ClientContact::query()
            ->where('email', $user->email)
            ->with('client')
            ->first();

        if ($contact?->client !== null) {
            return $contact->client;
        }

        abort(403, 'Accès portail client refusé.');
    }

    protected function resolveProjectForClient(Request $request, Project $project): Project
    {
        $client = $this->resolveClientForUser($request);

        if ($project->client_id !== $client->id) {
            abort(404);
        }

        return $project;
    }
}
