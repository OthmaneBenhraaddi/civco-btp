<?php

namespace App\Enums;

enum NotificationType: string
{
    case Chat = 'chat';
    case QuoteSigned = 'quote_signed';
    case InvoiceCreated = 'invoice_created';
    case ProjectAlert = 'project_alert';
    case AmendmentPending = 'amendment_pending';
    case AmendmentResolved = 'amendment_resolved';
}
