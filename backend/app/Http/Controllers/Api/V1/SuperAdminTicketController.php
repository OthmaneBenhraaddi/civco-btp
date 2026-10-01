<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreCmsTicketRequest;
use App\Http\Requests\Ticket\StoreTicketMessageRequest;
use App\Http\Resources\TicketMessageResource;
use App\Http\Resources\TicketResource;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class SuperAdminTicketController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Ticket::query()
            ->withoutGlobalScope('tenant')
            ->where('is_cms_ticket', true)
            ->with(['tenant', 'targetAdmin', 'createdBy'])
            ->withCount('messages')
            ->orderByDesc('updated_at');

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->integer('tenant_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return TicketResource::collection(
            $query->paginate($request->integer('per_page', 50))->withQueryString()
        );
    }

    public function store(StoreCmsTicketRequest $request): JsonResponse
    {
        $tenant = Tenant::query()->findOrFail($request->integer('tenant_id'));
        $targetAdminId = $request->filled('target_admin_id')
            ? $request->integer('target_admin_id')
            : null;

        if ($targetAdminId !== null) {
            $this->assertAdminBelongsToTenant($tenant, $targetAdminId);
        }

        $companyId = $this->companyIdForTenant($tenant);

        $ticket = DB::transaction(function () use ($request, $tenant, $targetAdminId, $companyId) {
            $ticket = Ticket::query()->create([
                'tenant_id' => $tenant->id,
                'company_id' => $companyId,
                'project_id' => null,
                'client_id' => null,
                'is_cms_ticket' => true,
                'target_admin_id' => $targetAdminId,
                'created_by_user_id' => $request->user()->id,
                'title' => $request->string('title')->toString(),
                'category' => $request->string('category')->toString(),
                'priority' => TicketPriority::from($request->string('priority')->toString()),
                'status' => TicketStatus::AwaitingStaff,
                'body' => $request->string('body')->toString(),
            ]);

            TicketMessage::query()->create([
                'tenant_id' => $tenant->id,
                'ticket_id' => $ticket->id,
                'sender_id' => $request->user()->id,
                'sender_role' => TicketMessage::roleFor($request->user()),
                'body' => $request->string('body')->toString(),
            ]);

            return $ticket;
        });

        $ticket->load(['tenant', 'targetAdmin', 'createdBy', 'messages.sender']);
        $this->notificationService->notifyTicketCreated($ticket, $request->user());

        return (new TicketResource($ticket))->response()->setStatusCode(201);
    }

    public function show(Request $request, Ticket $ticket): TicketResource
    {
        $this->ensureCmsTicket($ticket);
        $ticket = Ticket::query()->withoutGlobalScope('tenant')->findOrFail($ticket->id);
        $this->authorize('view', $ticket);

        return new TicketResource(
            $ticket->load(['tenant', 'project', 'client', 'createdBy', 'targetAdmin', 'closedBy', 'messages.sender'])
        );
    }

    public function storeMessage(StoreTicketMessageRequest $request, Ticket $ticket): JsonResponse
    {
        $this->ensureCmsTicket($ticket);
        $this->authorize('reply', $ticket);

        $message = TicketMessage::query()->create([
            'tenant_id' => $ticket->tenant_id,
            'ticket_id' => $ticket->id,
            'sender_id' => $request->user()->id,
            'sender_role' => TicketMessage::roleFor($request->user()),
            'body' => $request->string('body')->toString(),
        ]);

        $ticket->markAwaitingReplyFrom($request->user());
        $message->load('sender');
        $this->notificationService->notifyTicketReplied($ticket->fresh(), $message, $request->user());

        return (new TicketMessageResource($message))
            ->response()
            ->setStatusCode(201);
    }

    public function close(Request $request, Ticket $ticket): TicketResource
    {
        $this->ensureCmsTicket($ticket);
        $this->authorize('close', $ticket);

        if (! $ticket->isClosed()) {
            $ticket->update([
                'status' => TicketStatus::Resolved,
                'closed_at' => now(),
                'closed_by_user_id' => $request->user()->id,
            ]);
            $this->notificationService->notifyTicketClosed($ticket->fresh(), $request->user());
        }

        return new TicketResource(
            $ticket->fresh()->load(['tenant', 'createdBy', 'targetAdmin', 'closedBy', 'messages.sender'])
        );
    }

    private function ensureCmsTicket(Ticket $ticket): void
    {
        if (! $ticket->is_cms_ticket) {
            abort(404);
        }
    }

    private function assertAdminBelongsToTenant(Tenant $tenant, int $adminId): void
    {
        $belongs = User::query()
            ->whereKey($adminId)
            ->where('tenant_id', $tenant->id)
            ->where('role', 'admin')
            ->whereNull('client_id')
            ->exists();

        if (! $belongs) {
            abort(422, 'Cet administrateur n\'appartient pas à l\'entité sélectionnée.');
        }
    }

    private function companyIdForTenant(Tenant $tenant): int
    {
        $admin = $tenant->admins()->where('is_active', true)->first()
            ?? $tenant->admins()->first();

        $companyId = $admin?->primaryCompany()?->id;

        if ($companyId === null) {
            abort(422, 'Cette entité n\'a pas de société associée.');
        }

        return (int) $companyId;
    }
}
