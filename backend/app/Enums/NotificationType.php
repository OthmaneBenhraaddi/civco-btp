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
    case ContractSigned = 'contract_signed';
    case TicketCreated = 'ticket_created';
    case TicketReplied = 'ticket_replied';
    case TicketClosed = 'ticket_closed';
}
