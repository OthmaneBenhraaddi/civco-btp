<?php

namespace App\Enums;

enum DispatchNoteStatus: string
{
    case Draft = 'draft';
    case Executed = 'executed';
    case Cancelled = 'cancelled';
}
