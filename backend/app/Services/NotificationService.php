<?php

namespace App\Services;

use App\Contracts\Notifications\NotificationDispatcher;
use App\Dto\Notifications\DispatchRecipient;
use App\Dto\Notifications\DispatchRequest;
use App\Enums\NotificationType;
use App\Enums\TicketStatus;
use App\Models\Contract;
use App\Models\ContractAmendment;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\PortalMessage;
use App\Models\Quote;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;

class NotificationService
{
    public function __construct(
        private readonly NotificationDispatcher $dispatcher,
    ) {}

    public function notify(
        User $recipient,
        ?int $tenantId,
        string $title,
        string $message,
        NotificationType $type,
        ?string $actionPath = null,
        bool $sendEmail = false,
    ): Notification {
        $channels = ['in_app'];
        if ($sendEmail && filled($recipient->email)) {
            $channels[] = 'email';
        }

        $response = $this->dispatcher->dispatch(new DispatchRequest(
            recipients: [
                new DispatchRecipient(
                    userId: (int) $recipient->id,
                    tenantId: $tenantId ?? $recipient->tenant_id,
                    email: $recipient->email,
                    name: $recipient->full_name,
                ),
            ],
            title: $title,
            message: $message,
            type: $type->value,
            actionPath: $actionPath,
            channels: $channels,
        ));

        $notificationId = $response->notificationIds[0] ?? null;

        if ($notificationId !== null) {
            return Notification::query()->findOrFail($notificationId);
        }

        return Notification::query()
            ->where('user_id', $recipient->id)
            ->where('title', $title)
            ->latest('id')
            ->firstOrFail();
    }

    public function notifyTenantAdmins(
        int $tenantId,
        string $title,
        string $message,
        NotificationType $type,
        ?string $actionPath = null,
        bool $sendEmail = false,
    ): void {
        $admins = User::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('client_id')
            ->where('role', 'admin')
            ->where('is_active', true)
            ->get(['id', 'tenant_id', 'email', 'first_name', 'last_name']);

        if ($admins->isEmpty()) {
            return;
        }

        $channels = ['in_app'];
        if ($sendEmail) {
            $channels[] = 'email';
        }

        $this->dispatcher->dispatch(new DispatchRequest(
            recipients: $admins->map(fn (User $admin) => new DispatchRecipient(
                userId: (int) $admin->id,
                tenantId: $tenantId,
                email: $admin->email,
                name: $admin->full_name,
            ))->all(),
            title: $title,
            message: $message,
            type: $type->value,
            actionPath: $actionPath,
            channels: $channels,
        ));
    }

    public function notifyCompanyAdmins(
        int $companyId,
        string $title,
        string $message,
        ?int $excludeUserId = null,
        ?string $actionPath = null,
    ): void {
        $admins = User::query()
            ->where('role', 'admin')
            ->where('is_active', true)
            ->whereHas('companies', fn ($query) => $query->where('companies.id', $companyId))
            ->when($excludeUserId !== null, fn ($query) => $query->where('id', '!=', $excludeUserId))
            ->get(['id', 'tenant_id', 'email', 'first_name', 'last_name']);

        if ($admins->isEmpty()) {
            return;
        }

        $this->dispatcher->dispatch(new DispatchRequest(
            recipients: $admins->map(fn (User $admin) => new DispatchRecipient(
                userId: (int) $admin->id,
                tenantId: $admin->tenant_id,
                email: $admin->email,
                name: $admin->full_name,
            ))->all(),
            title: $title,
            message: $message,
            type: NotificationType::ProjectAlert->value,
            actionPath: $actionPath,
            channels: ['in_app'],
        ));
    }

    public function notifyChatMessage(
        PortalMessage $message,
        User $receiver,
        User $clientUser,
    ): void {
        $senderName = $message->sender?->full_name ?? 'Contact';
        $projectLabel = $message->project
            ? "« {$message->project->reference} »"
            : 'la messagerie générale';

        if ($receiver->isClientPortalUser()) {
            $title = 'Nouveau message';
            $body = "{$senderName} vous a écrit dans {$projectLabel}.";
            $actionPath = $this->clientThreadPath($message->project_id);
        } else {
            $title = 'Message client';
            $body = "{$senderName} a envoyé un message dans {$projectLabel}.";
            $actionPath = $this->adminThreadPath($clientUser->id, $message->project_id);
        }

        $this->notify(
            $receiver,
            $message->tenant_id,
            $title,
            $body,
            NotificationType::Chat,
            $actionPath,
        );
    }

    public function notifyQuoteSigned(Quote $quote, User $signingClientUser): void
    {
        $quote->loadMissing(['client', 'project']);

        $clientName = $quote->client?->name ?? $signingClientUser->full_name;
        $reference = $quote->reference;
        $projectLabel = $quote->project?->title
            ? "« {$quote->project->title} »"
            : 'sans projet associé';

        $this->notifyTenantAdmins(
            (int) $quote->tenant_id,
            'Devis signé',
            "Le client {$clientName} a signé le devis « {$reference} » ({$projectLabel}).",
            NotificationType::QuoteSigned,
            "/quotes/{$quote->id}",
        );
    }

    public function notifyContractSigned(Contract $contract, User $signingClientUser): void
    {
        $contract->loadMissing(['client', 'project']);

        if ($contract->tenant_id === null) {
            return;
        }

        $clientName = $contract->client?->name ?? $signingClientUser->full_name;
        $project = $contract->project;
        $projectLabel = $project?->title
            ? "« {$project->title} »"
            : 'sans projet associé';
        $actionPath = $project?->id ? "/projects/{$project->id}" : '/projects';

        $this->notifyTenantAdmins(
            (int) $contract->tenant_id,
            'Contrat signé',
            "Le client {$clientName} a signé le contrat ({$projectLabel}).",
            NotificationType::ContractSigned,
            $actionPath,
        );
    }

    public function notifyTicketCreated(Ticket $ticket, User $actor): void
    {
        $ticket->loadMissing(['client', 'project']);

        if ($ticket->tenant_id === null) {
            return;
        }

        $title = $ticket->title;
        $projectLabel = $ticket->project?->title
            ? "« {$ticket->project->title} »"
            : 'sans projet';

        if ($actor->isClientPortalUser()) {
            $clientName = $ticket->client?->name ?? $actor->full_name;
            $this->notifyTenantAdmins(
                (int) $ticket->tenant_id,
                'Nouveau ticket',
                "{$clientName} a ouvert le ticket « {$title} » ({$projectLabel}).",
                NotificationType::TicketCreated,
                "/tickets/{$ticket->id}",
            );

            return;
        }

        $this->notifyPortalUsersForClient(
            (int) $ticket->tenant_id,
            (int) $ticket->client_id,
            'Nouveau ticket',
            "Un ticket « {$title} » a été ouvert concernant {$projectLabel}.",
            NotificationType::TicketCreated,
            "/portal/tickets/{$ticket->id}",
            excludeUserId: (int) $actor->id,
            sendEmail: true,
            mailSubject: 'CivCo — nouveau ticket',
        );
    }

    public function notifyTicketReplied(Ticket $ticket, TicketMessage $message, User $actor): void
    {
        $ticket->loadMissing(['client', 'project']);
        $message->loadMissing('sender');

        if ($ticket->tenant_id === null) {
            return;
        }

        $title = $ticket->title;
        $senderName = $message->sender?->full_name ?? $actor->full_name;

        if ($actor->isClientPortalUser()) {
            $this->notifyTenantAdmins(
                (int) $ticket->tenant_id,
                'Réponse ticket',
                "{$senderName} a répondu sur le ticket « {$title} ».",
                NotificationType::TicketReplied,
                "/tickets/{$ticket->id}",
            );

            return;
        }

        $this->notifyPortalUsersForClient(
            (int) $ticket->tenant_id,
            (int) $ticket->client_id,
            'Réponse ticket',
            "{$senderName} a répondu sur votre ticket « {$title} ».",
            NotificationType::TicketReplied,
            "/portal/tickets/{$ticket->id}",
            excludeUserId: (int) $actor->id,
            sendEmail: true,
            mailSubject: 'CivCo — réponse sur votre ticket',
        );
    }

    public function notifyTicketClosed(Ticket $ticket, User $actor): void
    {
        $ticket->loadMissing(['client', 'project']);

        if ($ticket->tenant_id === null || $ticket->client_id === null) {
            return;
        }

        $title = $ticket->title;
        $projectLabel = $ticket->project?->title
            ? "« {$ticket->project->title} »"
            : 'sans projet';

        if ($actor->isClientPortalUser()) {
            $clientName = $ticket->client?->name ?? $actor->full_name;
            $this->notifyTenantAdmins(
                (int) $ticket->tenant_id,
                'Ticket clôturé',
                "{$clientName} a clôturé le ticket « {$title} » ({$projectLabel}).",
                NotificationType::TicketClosed,
                "/tickets/{$ticket->id}",
            );

            return;
        }

        $this->notifyPortalUsersForClient(
            (int) $ticket->tenant_id,
            (int) $ticket->client_id,
            'Ticket clôturé',
            "Le ticket « {$title} » ({$projectLabel}) a été clôturé.",
            NotificationType::TicketClosed,
            "/portal/tickets/{$ticket->id}",
            excludeUserId: (int) $actor->id,
            sendEmail: true,
            mailSubject: 'CivCo — ticket clôturé',
        );
    }

    /**
     * After portal access is turned on, catch the client up on open tickets
     * that were created before a portal account existed.
     */
    public function notifyOpenTicketsAfterPortalActivation(User $portalUser): void
    {
        if ($portalUser->client_id === null || ! $portalUser->is_active) {
            return;
        }

        $tickets = Ticket::query()
            ->where('client_id', $portalUser->client_id)
            ->where('tenant_id', $portalUser->tenant_id)
            ->where('status', '!=', TicketStatus::Resolved->value)
            ->orderByDesc('updated_at')
            ->limit(20)
            ->get(['id', 'tenant_id', 'title', 'project_id']);

        foreach ($tickets as $ticket) {
            $alreadyNotified = Notification::query()
                ->where('user_id', $portalUser->id)
                ->where('action_path', "/portal/tickets/{$ticket->id}")
                ->exists();

            if ($alreadyNotified) {
                continue;
            }

            $this->notify(
                $portalUser,
                $ticket->tenant_id,
                'Ticket en cours',
                "Le ticket « {$ticket->title} » vous concerne et attend une suite.",
                NotificationType::TicketCreated,
                "/portal/tickets/{$ticket->id}",
                sendEmail: true,
            );
        }
    }

    public function notifyInvoiceCreated(Invoice $invoice): void
    {
        $invoice->loadMissing(['client', 'project']);

        $this->notifyPortalUsersForClient(
            $invoice->tenant_id !== null ? (int) $invoice->tenant_id : null,
            (int) $invoice->client_id,
            'Nouvelle facture',
            'La facture « '.$invoice->reference.' » est disponible'
                .(
                    $invoice->project?->title
                        ? " pour « {$invoice->project->title} »."
                        : ' pour votre compte.'
                ),
            NotificationType::InvoiceCreated,
            '/portal/quotes',
        );
    }

    public function notifyAmendmentPending(ContractAmendment $amendment): void
    {
        $amendment->loadMissing(['project.client']);
        $project = $amendment->project;

        if ($project === null || $project->client_id === null) {
            return;
        }

        $portalUsers = User::query()
            ->where('client_id', $project->client_id)
            ->where('is_active', true)
            ->get(['id', 'tenant_id', 'email', 'first_name', 'last_name']);

        if ($portalUsers->isEmpty()) {
            return;
        }

        $this->dispatcher->dispatch(new DispatchRequest(
            recipients: $portalUsers->map(fn (User $user) => new DispatchRecipient(
                userId: (int) $user->id,
                tenantId: $user->tenant_id ?? $amendment->tenant_id,
                email: $user->email,
                name: $user->full_name,
            ))->all(),
            title: 'Avenant en attente',
            message: "L'avenant « {$amendment->title} » du projet « {$project->title} » attend votre validation.",
            type: NotificationType::AmendmentPending->value,
            actionPath: '/portal',
            channels: ['in_app', 'email'],
            mailSubject: 'CivCo — avenant en attente de validation',
        ));
    }

    public function notifyAmendmentResolved(ContractAmendment $amendment): void
    {
        $amendment->loadMissing(['project', 'createdBy']);
        $project = $amendment->project;

        if ($project?->tenant_id === null) {
            return;
        }

        $statusLabel = $amendment->status?->value === 'validated' ? 'validé' : 'refusé';

        $this->notifyTenantAdmins(
            (int) $project->tenant_id,
            'Avenant '.$statusLabel,
            "L'avenant « {$amendment->title} » du projet « {$project->title} » a été {$statusLabel}.",
            NotificationType::AmendmentResolved,
            "/projects/{$project->id}",
            sendEmail: true,
        );
    }

    private function notifyPortalUsersForClient(
        ?int $tenantId,
        int $clientId,
        string $title,
        string $message,
        NotificationType $type,
        ?string $actionPath = null,
        ?int $excludeUserId = null,
        bool $sendEmail = false,
        ?string $mailSubject = null,
    ): void {
        $query = User::query()
            ->where('client_id', $clientId)
            ->where('is_active', true);

        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }

        if ($excludeUserId !== null) {
            $query->where('id', '!=', $excludeUserId);
        }

        $portalUsers = $query->get(['id', 'tenant_id', 'email', 'first_name', 'last_name']);

        if ($portalUsers->isEmpty()) {
            return;
        }

        $channels = ['in_app'];
        if ($sendEmail) {
            $channels[] = 'email';
        }

        $this->dispatcher->dispatch(new DispatchRequest(
            recipients: $portalUsers->map(fn (User $user) => new DispatchRecipient(
                userId: (int) $user->id,
                tenantId: $tenantId ?? $user->tenant_id,
                email: $user->email,
                name: $user->full_name,
            ))->all(),
            title: $title,
            message: $message,
            type: $type->value,
            actionPath: $actionPath,
            channels: $channels,
            mailSubject: $mailSubject,
        ));
    }

    private function adminThreadPath(int $clientUserId, ?int $projectId): string
    {
        $thread = $projectId === null ? 'general' : "project:{$projectId}";

        return "/tickets?client={$clientUserId}&thread={$thread}";
    }

    private function clientThreadPath(?int $projectId): string
    {
        $thread = $projectId === null ? 'general' : "project:{$projectId}";

        return "/portal/tickets?thread={$thread}";
    }
}
