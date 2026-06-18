<?php

namespace App\Enums;

enum DocumentStatus: string
{
    case Active = 'active';
    case Archived = 'archived';
}
