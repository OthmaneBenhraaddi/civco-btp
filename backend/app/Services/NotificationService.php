<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Models\Invoice;
use App\Models\PortalMessage;
use App\Models\Quote;
use App\Models\User;
use App\Models\Notification;

class NotificationService
{
    public function notify(
        User $recipient,
        ?int $tenantId,
        string $title,
        string $message,
        NotificationType $type,
        ?string $actionPath = null,
    ): Notification {
        return Notification::query()->create([
            'user_id' => $recipient->id,
            'tenant_id' => $tenantId ?? $recipient->tenant_id,
            'title' => $title,
            'message' => $message,
            'type' => $type->value,
            'action_path' => $actionPath,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function notifyTenantAdmins(
        int $tenantId,
        string $title,
        string $message,
        NotificationType $type,
        ?string $actionPath = null,
    ): void {
        $admins = User::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('client_id')
            ->where('role', 'admin')
            ->where('is_active', true)
            ->get(['id', 'tenant_id']);

        foreach ($admins as $admin) {
            $this->notify($admin, $tenantId, $title, $message, $type, $actionPath);
        }
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
