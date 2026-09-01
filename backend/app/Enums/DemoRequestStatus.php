<?php

namespace App\Enums;

enum DemoRequestStatus: string
{
    case Pending = 'pending';
    case Contacted = 'contacted';
    case Closed = 'closed';
}
