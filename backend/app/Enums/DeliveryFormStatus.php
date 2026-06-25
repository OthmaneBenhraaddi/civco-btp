<?php

namespace App\Enums;

enum DeliveryFormStatus: string
{
    case Draft = 'draft';
    case Signed = 'signed';
    case Invoiced = 'invoiced';
}
