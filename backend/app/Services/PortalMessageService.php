<?php

namespace App\Services;

use App\Models\Client;
use App\Models\PortalMessage;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class PortalMessageService
{
    public function __construct(
        private readonly ClientPortalService $clientPortalService,
        private readonly NotificationService $notificationService,
        private readonly MessagingPresenceService $messagingPresenceService,
    ) {}

    /**
     * @return array{general: array<string, mixed>, projects: list<array<string, mixed>>}
     */
    public function threadsForClientUser(User $clientUser): array
    {
        $this->assertClientPortalUser($clientUser);
        $client = $this->resolveClientForPortalUser($clientUser);

        $projects = $this->clientPortalService->activeProjectsForClient($client);

        return [
            'general' => [
                'project_id' => null,
                'unread_count' => $this->unreadCountForClientThread($clientUser, null),
            ],
            'projects' => $projects->map(fn (Project $project) => [
                'project_id' => $project->id,
                'reference' => $project->reference,
                'title' => $project->title,
                'unread_count' => $this->unreadCountForClientThread($clientUser, $project->id),
            ])->values()->all(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function clientGroupsForStaff(User $staffUser): array
    {
        $tenantId = $this->requireTenantId($staffUser);
        $clients = $this->clientPortalUsersForTenant($tenantId);
        $isAdmin = $staffUser->isAdmin();
        $chatEnabledProjectIds = $isAdmin
            ? null
            : $this->chatEnabledProjectIdsForUser($staffUser);

        return $clients->map(function (User $clientUser) use ($staffUser, $isAdmin, $chatEnabledProjectIds): ?array {
            $client = $this->resolveClientForPortalUser($clientUser);
            $projects = $this->clientPortalService->activeProjectsForClient($client);

            $threads = [];

            if ($isAdmin) {
                $threads[] = [
                    'project_id' => null,
                    'label' => 'general',
                    'unread_count' => $this->unreadCountForStaffThread($staffUser, $clientUser, null),
                ];
            }

            foreach ($projects as $project) {
                if (! $isAdmin && ! in_array((int) $project->id, $chatEnabledProjectIds ?? [], true)) {
                    continue;
                }

                $threads[] = [
                    'project_id' => $project->id,
                    'reference' => $project->reference,
                    'title' => $project->title,
                    'unread_count' => $this->unreadCountForStaffThread($staffUser, $clientUser, $project->id),
                ];
            }

            if ($threads === []) {
                return null;
            }

            $totalUnread = array_sum(array_column($threads, 'unread_count'));

            return [
                'client_user_id' => $clientUser->id,
                'client_name' => $clientUser->full_name,
                'client_email' => $clientUser->email,
                'unread_count' => $totalUnread,
                'threads' => $threads,
            ];
        })->filter()->sortBy([
            fn (array $group) => -$group['unread_count'],
            fn (array $group) => $group['client_name'],
        ])->values()->all();
    }

    /** @return Collection<int, PortalMessage> */
    public function threadMessages(User $actor, User $clientUser, ?int $projectId = null): Collection
    {
        $this->assertCanAccessThread($actor, $clientUser, $projectId);

        return $this->threadQuery($clientUser, $projectId)
            ->with([
                'sender:id,first_name,last_name,client_id,job_title,role',
                'receiver:id,first_name,last_name,client_id,job_title,role',
                'project:id,reference,title',
            ])
            ->orderBy('created_at')
            ->get();
    }

    public function sendThreadMessage(
        User $sender,
        User $clientUser,
        string $messageText,
        ?int $projectId = null,
    ): PortalMessage {
        $messageText = trim($messageText);

        if ($messageText === '') {
            throw new InvalidArgumentException('Le message ne peut pas être vide.');
        }

        $this->assertCanAccessThread($sender, $clientUser, $projectId);

        if ($sender->isClientPortalUser()) {
            if ($sender->id !== $clientUser->id) {
                throw new AccessDeniedHttpException('Conversation non autorisée.');
            }

            $receiver = $this->primaryStaffContact((int) $sender->tenant_id, $projectId);
        } else {
            $receiver = $clientUser;
        }

        $message = PortalMessage::query()->create([
            'tenant_id' => $sender->tenant_id,
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'project_id' => $projectId,
            'message_text' => $messageText,
        ])->load([
            'sender:id,first_name,last_name,client_id,job_title,role',
            'receiver:id,first_name,last_name,client_id,job_title,role',
            'project:id,reference,title',
        ]);

        if (! $this->messagingPresenceService->isViewingThread($receiver, $projectId, $clientUser->id)) {
            $this->notificationService->notifyChatMessage($message, $receiver, $clientUser);
        }

        return $message;
    }

    public function markThreadAsRead(User $reader, User $clientUser, ?int $projectId = null): void
    {
        $this->assertCanAccessThread($reader, $clientUser, $projectId);

        $query = PortalMessage::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $reader->tenant_id)
            ->where('receiver_id', $reader->id)
            ->whereNull('read_at');

        if ($reader->isClientPortalUser()) {
            $query->where('sender_id', '!=', $reader->id);
        } else {
            $query->where('sender_id', $clientUser->id);
        }

        $this->applyProjectScope($query, $projectId);

        $query->update(['read_at' => now()]);
    }

    /** @deprecated Use threadMessages() */
    public function contactsForUser(User $user): Collection
    {
        $tenantId = $this->requireTenantId($user);

        if ($user->isClientPortalUser()) {
            return $this->staffContactsForTenant($tenantId);
        }

        return $this->clientContactsForStaff($user);
    }

    /** @deprecated Use threadMessages() */
    public function conversationBetween(User $actor, User $contact): Collection
    {
        if ($actor->isClientPortalUser()) {
            return $this->threadMessages($actor, $actor, null);
        }

        if (! $contact->isClientPortalUser()) {
            throw new AccessDeniedHttpException('Conversation non autorisée.');
        }

        return $this->threadMessages($actor, $contact, null);
    }

    /** @deprecated Use sendThreadMessage() */
    public function sendMessage(User $sender, int $receiverId, string $messageText): PortalMessage
    {
        $receiver = User::query()->findOrFail($receiverId);

        if ($sender->isClientPortalUser()) {
            return $this->sendThreadMessage($sender, $sender, $messageText, null);
        }

        if (! $receiver->isClientPortalUser()) {
            throw new AccessDeniedHttpException('Conversation non autorisée.');
        }

        return $this->sendThreadMessage($sender, $receiver, $messageText, null);
    }

    /** @deprecated */
    public function resolveContactForUser(User $actor, User $contact): User
    {
        if ($actor->isClientPortalUser()) {
            $this->assertClientPortalUser($actor);

            return $actor;
        }

        $this->assertClientPortalUser($contact);

        return $contact;
    }

    /** @deprecated Use markThreadAsRead() */
    public function markConversationAsRead(User $reader, User $contact): void
    {
        $clientUser = $reader->isClientPortalUser() ? $reader : $contact;
        $this->markThreadAsRead($reader, $clientUser, null);
    }

    private function threadQuery(User $clientUser, ?int $projectId)
    {
        $query = PortalMessage::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $clientUser->tenant_id)
            ->where(function ($builder) use ($clientUser): void {
                $builder
                    ->where('sender_id', $clientUser->id)
                    ->orWhere('receiver_id', $clientUser->id);
            });

        return $this->applyProjectScope($query, $projectId);
    }

    private function applyProjectScope($query, ?int $projectId)
    {
        if ($projectId === null) {
            return $query->whereNull('project_id');
        }

        return $query->where('project_id', $projectId);
    }

    private function unreadCountForClientThread(User $clientUser, ?int $projectId): int
    {
        $query = PortalMessage::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $clientUser->tenant_id)
            ->where('receiver_id', $clientUser->id)
            ->whereNull('read_at')
            ->where('sender_id', '!=', $clientUser->id);

        return (int) $this->applyProjectScope($query, $projectId)->count();
    }

    private function unreadCountForStaffThread(User $staffUser, User $clientUser, ?int $projectId): int
    {
        $query = PortalMessage::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $staffUser->tenant_id)
            ->where('receiver_id', $staffUser->id)
            ->where('sender_id', $clientUser->id)
            ->whereNull('read_at');

        return (int) $this->applyProjectScope($query, $projectId)->count();
    }

    private function assertCanAccessThread(User $actor, User $clientUser, ?int $projectId): void
    {
        $this->assertClientPortalUser($clientUser);

        if ($actor->tenant_id === null || $clientUser->tenant_id === null) {
            throw new AccessDeniedHttpException('Conversation inter-entités interdite.');
        }

        if ($actor->tenant_id !== $clientUser->tenant_id) {
            throw new AccessDeniedHttpException('Conversation hors entité interdite.');
        }

        if ($actor->isClientPortalUser() && $actor->id !== $clientUser->id) {
            throw new AccessDeniedHttpException('Conversation non autorisée.');
        }

        if (! $actor->isClientPortalUser() && $actor->client_id !== null) {
            throw new AccessDeniedHttpException('Conversation non autorisée.');
        }

        if ($projectId !== null) {
            $client = $this->resolveClientForPortalUser($clientUser);
            $project = Project::query()
                ->where('id', $projectId)
                ->where('client_id', $client->id)
                ->where('tenant_id', $clientUser->tenant_id)
                ->first();

            if ($project === null) {
                throw new AccessDeniedHttpException('Projet non accessible pour cette conversation.');
            }

            if (! $actor->isClientPortalUser()) {
                $this->assertStaffCanChatOnProject($actor, $project);
            }

            return;
        }

        // Fil de discussion général (hors projet) : réservé aux admins côté équipe.
        if (! $actor->isClientPortalUser() && ! $actor->isAdmin()) {
            throw new AccessDeniedHttpException(
                'Discussion client non autorisée. Demandez à un administrateur d\'activer le chat sur un projet.'
            );
        }
    }

    private function assertStaffCanChatOnProject(User $staffUser, Project $project): void
    {
        if ($staffUser->isAdmin()) {
            return;
        }

        $canChat = $project->teamMembers()
            ->where('users.id', $staffUser->id)
            ->wherePivot('can_chat_with_client', true)
            ->exists();

        if (! $canChat) {
            throw new AccessDeniedHttpException(
                'Vous n\'êtes pas autorisé à discuter avec le client sur ce projet.'
            );
        }
    }

    /**
     * @return list<int>
     */
    private function chatEnabledProjectIdsForUser(User $staffUser): array
    {
        return Project::query()
            ->where('tenant_id', $staffUser->tenant_id)
            ->whereHas('teamMembers', function ($query) use ($staffUser): void {
                $query->where('users.id', $staffUser->id)
                    ->where('project_user.can_chat_with_client', true);
            })
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function assertClientPortalUser(User $user): void
    {
        if (! $user->isClientPortalUser()) {
            throw new AccessDeniedHttpException('Compte portail client requis.');
        }
    }

    private function resolveClientForPortalUser(User $clientUser): Client
    {
        return Client::query()->findOrFail($clientUser->client_id);
    }

    private function primaryStaffContact(int $tenantId, ?int $projectId = null): User
    {
        if ($projectId !== null) {
            $chatEnabled = User::query()
                ->where('tenant_id', $tenantId)
                ->whereNull('client_id')
                ->where('is_active', true)
                ->whereHas('assignedProjects', function ($query) use ($projectId): void {
                    $query->where('projects.id', $projectId)
                        ->where('project_user.can_chat_with_client', true);
                })
                ->orderBy('id')
                ->first();

            if ($chatEnabled !== null) {
                return $chatEnabled;
            }
        }

        $admin = User::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('client_id')
            ->where('is_active', true)
            ->where('role', 'admin')
            ->orderBy('id')
            ->first();

        if ($admin !== null) {
            return $admin;
        }

        $staff = User::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('client_id')
            ->where('is_active', true)
            ->orderBy('id')
            ->first();

        if ($staff === null) {
            throw new AccessDeniedHttpException('Aucun membre de l\'équipe disponible.');
        }

        return $staff;
    }

    private function requireTenantId(User $user): int
    {
        if ($user->tenant_id === null) {
            throw new AccessDeniedHttpException('Aucune entité associée à ce compte.');
        }

        return $user->tenant_id;
    }

    /** @return Collection<int, User> */
    private function staffContactsForTenant(int $tenantId): Collection
    {
        return User::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('client_id')
            ->where('is_active', true)
            ->orderByRaw("CASE WHEN role = 'admin' THEN 0 ELSE 1 END")
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email', 'job_title', 'role', 'client_id']);
    }

    /** @return Collection<int, User> */
    private function clientContactsForStaff(User $staffUser): Collection
    {
        $tenantId = $this->requireTenantId($staffUser);
        $clients = $this->clientPortalUsersForTenant($tenantId);
        $unreadCounts = $this->unreadCountsFromSenders($staffUser);

        return $clients
            ->each(function (User $client) use ($unreadCounts): void {
                $client->setAttribute('unread_count', $unreadCounts[$client->id] ?? 0);
            })
            ->sortBy([
                fn (User $client) => -((int) ($client->unread_count ?? 0)),
                fn (User $client) => $client->last_name,
                fn (User $client) => $client->first_name,
            ])
            ->values();
    }

    /** @return Collection<int, User> */
    private function clientPortalUsersForTenant(int $tenantId): Collection
    {
        return User::query()
            ->where('tenant_id', $tenantId)
            ->whereNotNull('client_id')
            ->where('is_active', true)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email', 'job_title', 'role', 'client_id']);
    }

    /**
     * @return array<int, int>
     */
    private function unreadCountsFromSenders(User $recipient): array
    {
        return PortalMessage::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $recipient->tenant_id)
            ->where('receiver_id', $recipient->id)
            ->whereNull('read_at')
            ->selectRaw('sender_id, COUNT(*) as aggregate')
            ->groupBy('sender_id')
            ->pluck('aggregate', 'sender_id')
            ->map(fn ($count) => (int) $count)
            ->all();
    }
}
