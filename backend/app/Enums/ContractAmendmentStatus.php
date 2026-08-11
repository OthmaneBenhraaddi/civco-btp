<?php

namespace App\Enums;

enum ContractAmendmentStatus: string
{
    case Draft = 'draft';
    case PendingClient = 'pending_client';
    case Validated = 'validated';
    case Refused = 'refused';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function isTerminal(): bool
    {
        return $this === self::Validated || $this === self::Refused;
    }

    public function isMutable(): bool
    {
        return $this === self::Draft;
    }
}
