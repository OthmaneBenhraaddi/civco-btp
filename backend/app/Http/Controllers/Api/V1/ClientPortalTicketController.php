<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Http\Controllers\Concerns\ResolvesClientPortalAccess;
use App\Http\Controllers\Concerns\ResolvesTenantContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\StoreTicketMessageRequest;
use App\Http\Requests\Ticket\StoreTicketRequest;
use App\Http\Resources\TicketMessageResource;
use App\Http\Resources\TicketResource;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ClientPortalTicketController extends Controller
{
    use ResolvesClientPortalAccess;
    use ResolvesTenantContext;

    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $client = $this->resolveClientForUser($request);

        $query = Ticket::query()
            ->where('client_id', $client->id)
            ->with(['project', 'client', 'createdBy'])
            ->withCount('messages')
            ->orderByDesc('updated_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return TicketResource::collection(
            $query->paginate($request->integer('per_page', 50))->withQueryString()
        );
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        $client = $this->resolveClientForUser($request);
        $project = Project::query()->findOrFail($request->integer('project_id'));
        $this->resolveProjectForClient($request, $project);

        if ($project->company_id === null) {
            abort(422, 'Projet invalide.');
        }

        $ticket = DB::transaction(function () use ($request, $client, $project) {
            $ticket = Ticket::query()->create([
                ...$this->tenantAttributesForCreate($request),
                'company_id' => $project->company_id,
                'project_id' => $project->id,
                'client_id' => $client->id,
                'created_by_user_id' => $request->user()->id,
                'title' => $request->string('title')->toString(),
                'category' => $request->string('category')->toString(),
                'priority' => TicketPriority::from($request->string('priority')->toString()),
                'status' => TicketStatus::AwaitingStaff,
                'body' => $request->string('body')->toString(),
            ]);

            TicketMessage::query()->create([
                ...$this->tenantAttributesForCreate($request),
                'ticket_id' => $ticket->id,
                'sender_id' => $request->user()->id,
                'body' => $request->string('body')->toString(),
            ]);

            return $ticket;
        });

        $ticket->load(['project', 'client', 'createdBy', 'messages.sender']);
        $this->notificationService->notifyTicketCreated($ticket, $request->user());

        return (new TicketResource($ticket))->response()->setStatusCode(201);
    }

    public function show(Request $request, Ticket $ticket): TicketResource
    {
        $this->ensureTicketBelongsToClient($request, $ticket);

        return new TicketResource(
            $ticket->load(['project', 'client', 'createdBy', 'closedBy', 'messages.sender'])
        );
    }

    public function storeMessage(StoreTicketMessageRequest $request, Ticket $ticket): JsonResponse
    {
        $this->ensureTicketBelongsToClient($request, $ticket);

        if ($ticket->isClosed()) {
            abort(422, 'Ce ticket est clos.');
        }

        $message = TicketMessage::query()->create([
            ...$this->tenantAttributesForCreate($request),
            'ticket_id' => $ticket->id,
            'sender_id' => $request->user()->id,
            'body' => $request->string('body')->toString(),
        ]);

        $ticket->markAwaitingReplyFrom($request->user());

        $message->load('sender');
        $this->notificationService->notifyTicketReplied($ticket->fresh(), $message, $request->user());

        return (new TicketMessageResource($message))
            ->response()
            ->setStatusCode(201);
    }

    private function ensureTicketBelongsToClient(Request $request, Ticket $ticket): void
    {
        $client = $this->resolveClientForUser($request);

        if ((int) $ticket->client_id !== (int) $client->id) {
            abort(404);
        }
    }
}
