<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClientPortal\StoreClientPortalThreadMessageRequest;
use App\Http\Requests\ClientPortal\StorePortalMessageRequest;
use App\Http\Resources\PortalMessageResource;
use App\Http\Resources\PortalMessageThreadListResource;
use App\Http\Resources\PortalMessagingClientGroupResource;
use App\Models\User;
use App\Services\PortalMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ClientPortalMessageController extends Controller
{
    public function __construct(
        private readonly PortalMessageService $portalMessageService,
    ) {}

    public function threads(Request $request): PortalMessageThreadListResource
    {
        $actor = $request->user();
        $this->assertMessagingUser($actor);

        return new PortalMessageThreadListResource(
            $this->portalMessageService->threadsForClientUser($actor)
        );
    }

    public function thread(Request $request): AnonymousResourceCollection
    {
        $actor = $request->user();
        $this->assertMessagingUser($actor);

        $projectId = $request->filled('project_id')
            ? $request->integer('project_id')
            : null;

        $this->portalMessageService->markThreadAsRead($actor, $actor, $projectId);

        return PortalMessageResource::collection(
            $this->portalMessageService->threadMessages($actor, $actor, $projectId)
        );
    }

    public function store(StoreClientPortalThreadMessageRequest $request): JsonResponse
    {
        $actor = $request->user();
        $this->assertMessagingUser($actor);

        $projectId = $request->filled('project_id')
            ? $request->integer('project_id')
            : null;

        try {
            $message = $this->portalMessageService->sendThreadMessage(
                $actor,
                $actor,
                $request->string('message_text')->toString(),
                $projectId,
            );
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return (new PortalMessageResource($message))
            ->response()
            ->setStatusCode(201);
    }

    private function assertMessagingUser(?User $user): void
    {
        if ($user === null) {
            abort(401);
        }

        if ($user->tenant_id === null) {
            throw new AccessDeniedHttpException('Messagerie réservée aux utilisateurs d\'entité.');
        }

        if ($user->isClientPortalUser() || $user->client_id === null) {
            return;
        }

        throw new AccessDeniedHttpException('Messagerie portail non autorisée pour ce compte.');
    }
}
