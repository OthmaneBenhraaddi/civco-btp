<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClientPortal\StorePortalMessageRequest;
use App\Http\Resources\PortalMessageResource;
use App\Http\Resources\PortalMessagingClientGroupResource;
use App\Models\User;
use App\Services\PortalMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class MessagingController extends Controller
{
    public function __construct(
        private readonly PortalMessageService $portalMessageService,
    ) {}

    public function threads(Request $request): AnonymousResourceCollection
    {
        $actor = $request->user();
        $this->assertStaffMessagingUser($actor);

        return PortalMessagingClientGroupResource::collection(
            $this->portalMessageService->clientGroupsForStaff($actor)
        );
    }

    public function thread(Request $request, User $clientUser): AnonymousResourceCollection
    {
        $actor = $request->user();
        $this->assertStaffMessagingUser($actor);

        if (! $clientUser->isClientPortalUser()) {
            throw new AccessDeniedHttpException('Compte client portail requis.');
        }

        $projectId = $request->filled('project_id')
            ? $request->integer('project_id')
            : null;

        $this->portalMessageService->markThreadAsRead($actor, $clientUser, $projectId);

        return PortalMessageResource::collection(
            $this->portalMessageService->threadMessages($actor, $clientUser, $projectId)
        );
    }

    public function store(StorePortalMessageRequest $request): JsonResponse
    {
        $actor = $request->user();
        $this->assertStaffMessagingUser($actor);

        $clientUser = User::query()->findOrFail($request->integer('receiver_id'));

        if (! $clientUser->isClientPortalUser()) {
            throw new AccessDeniedHttpException('Le destinataire doit être un compte client portail.');
        }

        $projectId = $request->filled('project_id')
            ? $request->integer('project_id')
            : null;

        try {
            $message = $this->portalMessageService->sendThreadMessage(
                $actor,
                $clientUser,
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

    private function assertStaffMessagingUser(?User $user): void
    {
        if ($user === null) {
            abort(401);
        }

        if ($user->tenant_id === null) {
            throw new AccessDeniedHttpException('Messagerie réservée aux utilisateurs d\'entité.');
        }

        if ($user->isClientPortalUser()) {
            throw new AccessDeniedHttpException('Utilisez l\'espace client pour la messagerie.');
        }
    }
}
