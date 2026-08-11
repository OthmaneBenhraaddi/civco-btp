<?php

namespace App\Services;

use App\Contracts\Notifications\NotificationDispatcher;
use App\Dto\Notifications\DispatchRecipient;
use App\Dto\Notifications\DispatchRequest;
use App\Enums\NotificationType;
use App\Models\ContractAmendment;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\PortalMessage;
use App\Models\Quote;
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

    public function notifyInvoiceCreated(Invoice $invoice): void
    {
        $invoice->loadMissing(['client', 'project']);

        $clientUser = User::query()
            ->where('tenant_id', $invoice->tenant_id)
            ->where('client_id', $invoice->client_id)
            ->where('is_active', true)
            ->orderBy('id')
            ->first();

        if ($clientUser === null) {
            return;
        }

        $reference = $invoice->reference;
        $projectLabel = $invoice->project?->title
            ? "« {$invoice->project->title} »"
            : 'votre compte';

        $this->notify(
            $clientUser,
            $invoice->tenant_id,
            'Nouvelle facture',
            "La facture « {$reference} » est disponible pour {$projectLabel}.",
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

    private function adminThreadPath(int $clientUserId, ?int $projectId): string
    {
        $thread = $projectId === null ? 'general' : "project:{$projectId}";

        return "/discussions?client={$clientUserId}&thread={$thread}";
    }

    private function clientThreadPath(?int $projectId): string
    {
        $thread = $projectId === null ? 'general' : "project:{$projectId}";

        return "/portal/discussions?thread={$thread}";
    }
}
