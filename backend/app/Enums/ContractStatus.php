<?php

namespace App\Enums;

enum ContractStatus: string
{
    case Draft = 'draft';
    case SignedByClient = 'signed_by_client';
    case FullyExecuted = 'fully_executed';
}
