<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Concerns\ResolvesTenantContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\StoreTicketMessageRequest;
use App\Http\Requests\Ticket\StoreTicketRequest;
use App\Http\Resources\TicketMessageResource;
use App\Http\Resources\TicketResource;
use App\Models\Client;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    use ResolvesCompanyContext;
    use ResolvesTenantContext;

    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Ticket::query()
            ->forCompany($this->companyId($request))
            ->with(['project', 'client', 'createdBy'])
            ->withCount('messages')
            ->orderByDesc('updated_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->integer('client_id'));
        }

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhereHas('client', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('project', fn ($q) => $q->where('title', 'like', "%{$search}%"));
            });
        }

        return TicketResource::collection(
            $query->paginate($request->integer('per_page', 50))->withQueryString()
        );
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        $companyId = $this->companyId($request);
        $this->assertClientBelongsToCompany($request, $request->integer('client_id'));

        $client = Client::query()->findOrFail($request->integer('client_id'));
        $project = null;

        if ($request->filled('project_id')) {
            $this->assertProjectBelongsToCompany($request, $request->integer('project_id'));
            $project = Project::query()->findOrFail($request->integer('project_id'));

            if ((int) $project->client_id !== (int) $client->id) {
                abort(422, 'Ce projet n\'appartient pas au client sélectionné.');
            }
        }

        $ticket = DB::transaction(function () use ($request, $companyId, $client, $project) {
            $ticket = Ticket::query()->create([
                ...$this->tenantAttributesForCreate($request),
                'company_id' => $companyId,
                'project_id' => $project?->id,
                'client_id' => $client->id,
                'created_by_user_id' => $request->user()->id,
                'title' => $request->string('title')->toString(),
                'category' => $request->string('category')->toString(),
                'priority' => TicketPriority::from($request->string('priority')->toString()),
                'status' => TicketStatus::AwaitingClient,
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
        $this->ensureTicketBelongsToCompany($request, $ticket);

        return new TicketResource(
            $ticket->load(['project', 'client', 'createdBy', 'closedBy', 'messages.sender'])
        );
    }

    public function storeMessage(StoreTicketMessageRequest $request, Ticket $ticket): JsonResponse
    {
        $this->ensureTicketBelongsToCompany($request, $ticket);

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

    public function close(Request $request, Ticket $ticket): TicketResource
    {
        $this->ensureTicketBelongsToCompany($request, $ticket);

        if ($ticket->isClosed()) {
            return new TicketResource(
                $ticket->load(['project', 'client', 'createdBy', 'closedBy', 'messages.sender'])
            );
        }

        $ticket->update([
            'status' => TicketStatus::Resolved,
            'closed_at' => now(),
            'closed_by_user_id' => $request->user()->id,
        ]);

        $ticket = $ticket->fresh()->load(['project', 'client', 'createdBy', 'closedBy', 'messages.sender']);
        $this->notificationService->notifyTicketClosed($ticket, $request->user());

        return new TicketResource($ticket);
    }

    private function ensureTicketBelongsToCompany(Request $request, Ticket $ticket): void
    {
        if ((int) $ticket->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
