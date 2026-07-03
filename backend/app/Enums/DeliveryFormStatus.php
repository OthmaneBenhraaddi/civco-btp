<?php

namespace App\Enums;

enum DeliveryFormStatus: string
{
    case Draft = 'draft';
    case Signed = 'signed';
    case SignedAndStamped = 'signed_and_stamped';
}
