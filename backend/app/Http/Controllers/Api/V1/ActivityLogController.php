<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ActivityLogController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'integer'],
            'project_id' => ['nullable', 'integer'],
            'action_type' => ['nullable', Rule::in(['created', 'updated', 'deleted'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = ActivityLog::query()
            ->where('company_id', $this->companyId($request))
            ->with(['user:id,first_name,last_name', 'project:id,title,reference'])
            ->orderByDesc('created_at');

        if (! empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        if (! empty($validated['project_id'])) {
            $query->where('project_id', $validated['project_id']);
        }

        if (! empty($validated['action_type'])) {
            $query->where('action_type', $validated['action_type']);
        }

        return ActivityLogResource::collection(
            $query->paginate($validated['per_page'] ?? 30)->withQueryString()
        );
    }
}
