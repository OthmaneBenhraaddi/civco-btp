<?php

namespace App\Enums;

enum DocumentTemplateType: string
{
    case Letter = 'letter';
    case Contract = 'contract';
    case Reminder = 'reminder';
    case Notice = 'notice';
    case Other = 'other';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
