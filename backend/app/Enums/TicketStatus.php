<?php

namespace App\Enums;

enum TicketStatus: string
{
    case Open = 'open';
    case AwaitingClient = 'awaiting_client';
    case AwaitingStaff = 'awaiting_staff';
    case Resolved = 'resolved';

    public function isClosed(): bool
    {
        return $this === self::Resolved;
    }

    public function isPending(): bool
    {
        return $this === self::AwaitingClient || $this === self::AwaitingStaff;
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
