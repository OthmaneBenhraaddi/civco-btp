<?php

namespace App\Enums;

enum NotificationType: string
{
    case Chat = 'chat';
    case QuoteSigned = 'quote_signed';
    case InvoiceCreated = 'invoice_created';
}
