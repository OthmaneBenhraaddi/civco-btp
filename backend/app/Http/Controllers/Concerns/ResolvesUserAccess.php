<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait ResolvesUserAccess
{
    protected function authenticatedUser(Request $request): User
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        return $user;
    }

    protected function applyProjectVisibilityScope(Builder $query, Request $request): Builder
    {
        $user = $this->authenticatedUser($request);

        if ($user->isAdmin()) {
            return $query;
        }

        return $query->whereHas('teamMembers', fn (Builder $builder) => $builder->where('users.id', $user->id));
    }

    protected function ensureProjectAccessibleToUser(Request $request, Project $project): void
    {
        if ($project->company_id !== $this->companyId($request)) {
            abort(404);
        }

        $user = $this->authenticatedUser($request);

        if ($user->isAdmin()) {
            return;
        }

        $isAssigned = $project->teamMembers()->where('users.id', $user->id)->exists();

        if (! $isAssigned) {
            abort(404);
        }
    }
}
