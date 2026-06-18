<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class AuditLogController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = AuditLog::query()
            ->where('company_id', $this->companyId($request))
            ->orderByDesc('created_at');

        if ($action = $request->string('action')->trim()->toString()) {
            $query->where('action', $action);
        }

        if ($entityType = $request->string('entity_type')->trim()->toString()) {
            $query->where('entity_type', $entityType);
        }

        return AuditLogResource::collection(
            $query->paginate($request->integer('per_page', 50))->withQueryString()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'actor_label' => ['required', 'string', 'max:200'],
            'action' => ['required', Rule::in(['creation', 'modification', 'suppression'])],
            'entity_type' => ['nullable', 'string', 'max:50'],
            'entity_id' => ['nullable', 'integer'],
            'message' => ['required', 'string'],
        ]);

        $log = AuditLog::query()->create([
            ...$validated,
            'company_id' => $this->companyId($request),
            'user_id' => $validated['user_id'] ?? $request->user()?->id,
            'created_at' => now(),
        ]);

        return (new AuditLogResource($log))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Request $request, AuditLog $auditLog): JsonResponse
    {
        if ($auditLog->company_id !== $this->companyId($request)) {
            abort(404);
        }

        $auditLog->delete();

        return response()->json(['message' => 'Audit log entry deleted.']);
    }
}
