<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function view(User $user, Ticket $ticket): bool
    {
        if ($user->isClientPortalUser()) {
            return ! $ticket->is_cms_ticket
                && $ticket->client_id !== null
                && (int) $user->client_id === (int) $ticket->client_id;
        }

        if ($ticket->is_cms_ticket) {
            if ($user->isSuperAdmin()) {
                return true;
            }

            return $this->entityAdminCanSee($user, $ticket);
        }

        if ($user->isSuperAdmin() || $user->tenant_id === null) {
            return false;
        }

        return (int) $user->tenant_id === (int) $ticket->tenant_id;
    }

    public function reply(User $user, Ticket $ticket): bool
    {
        return $this->view($user, $ticket) && ! $ticket->isClosed();
    }

    public function close(User $user, Ticket $ticket): bool
    {
        if ($user->isClientPortalUser()) {
            return false;
        }

        return $this->view($user, $ticket);
    }

    private function entityAdminCanSee(User $user, Ticket $ticket): bool
    {
        if (! $user->isAdmin() || $user->tenant_id === null) {
            return false;
        }

        if ((int) $user->tenant_id !== (int) $ticket->tenant_id) {
            return false;
        }

        return $ticket->target_admin_id === null
            || (int) $ticket->target_admin_id === (int) $user->id;
    }
}
