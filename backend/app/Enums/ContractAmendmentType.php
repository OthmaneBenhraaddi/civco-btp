<?php

namespace App\Enums;

enum ContractAmendmentType: string
{
    case Budget = 'budget';
    case Duration = 'duration';
    case Scope = 'scope';
    case Terms = 'terms';
    case Mixed = 'mixed';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
