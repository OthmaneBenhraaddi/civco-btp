<?php

/*
|--------------------------------------------------------------------------
| API routes (v1)
|--------------------------------------------------------------------------
|
| Local:      http://localhost:8000/api/v1/...
| Production: https://{subdomain}.monerp.com/api/v1/...
|
| Subdomain routing is configured in routes/tenancy.php
|
*/

use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BadgeController;
use App\Http\Controllers\Api\V1\ClientContactController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\ClientPortalController;
use App\Http\Controllers\Api\V1\ClientPortalMessageController;
use App\Http\Controllers\Api\V1\ClientPortalQuoteController;
use App\Http\Controllers\Api\V1\ClientPortalTicketController;
use App\Http\Controllers\Api\V1\CommercialDocumentController;
use App\Http\Controllers\Api\V1\CompanyUserController;
use App\Http\Controllers\Api\V1\ContractAmendmentController;
use App\Http\Controllers\Api\V1\ContractController;
use App\Http\Controllers\Api\V1\ContractTemplateController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DeliveryFormController;
use App\Http\Controllers\Api\V1\DemoController;
use App\Http\Controllers\Api\V1\DispatchNoteController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\DocumentTemplateController;
use App\Http\Controllers\Api\V1\DocumentTypeController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\GlobalSearchController;
use App\Http\Controllers\Api\V1\HomepageController;
use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\InvoiceLineController;
use App\Http\Controllers\Api\V1\LotController;
use App\Http\Controllers\Api\V1\MessagingController;
use App\Http\Controllers\Api\V1\MessagingPresenceController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\PrintTrackingController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProjectImportController;
use App\Http\Controllers\Api\V1\ProjectMediaController;
use App\Http\Controllers\Api\V1\ProjectPhaseController;
use App\Http\Controllers\Api\V1\ProjectProgressController;
use App\Http\Controllers\Api\V1\ProjectTeamController;
use App\Http\Controllers\Api\V1\QuoteController;
use App\Http\Controllers\Api\V1\QuoteLineController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SectorController;
use App\Http\Controllers\Api\V1\SuperAdminController;
use App\Http\Controllers\Api\V1\SuperAdminDemoCodeController;
use App\Http\Controllers\Api\V1\SuperAdminDemoRequestController;
use App\Http\Controllers\Api\V1\SuperAdminHomepageController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\TeamController;
use App\Http\Controllers\Api\V1\TenantSettingsController;
use App\Http\Controllers\Api\V1\ThemeColorController;
use App\Http\Controllers\Api\V1\TicketController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', fn () => response()->json([
        'status' => 'ok',
        'service' => 'btp-backend',
    ]));

    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1');
    Route::post('/demo/redeem', [DemoController::class, 'redeem'])
        ->middleware('throttle:10,1');
    Route::post('/demo/requests', [DemoController::class, 'storeRequest'])
        ->middleware('throttle:5,1');
    Route::get('/homepage', [HomepageController::class, 'show'])
        ->middleware('throttle:60,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::patch('/me', [AuthController::class, 'updateProfile']);
        Route::post('/me/avatar', [AuthController::class, 'updateAvatar']);
        Route::delete('/me/avatar', [AuthController::class, 'destroyAvatar']);
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::put('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/messaging/presence', [MessagingPresenceController::class, 'update']);

        Route::prefix('client-portal')->group(function (): void {
            Route::get('/projects', [ClientPortalController::class, 'projects']);
            Route::get('/projects/{project}/milestones', [ClientPortalController::class, 'milestones']);
            Route::get('/projects/{project}/media', [ClientPortalController::class, 'media']);
            Route::get('/projects/{project}/comments', [ClientPortalController::class, 'comments']);
            Route::post('/projects/{project}/comments', [ClientPortalController::class, 'storeComment']);
            Route::get('/projects/{project}/contract', [ClientPortalController::class, 'contract']);
            Route::post('/projects/{project}/contract/sign', [ClientPortalController::class, 'signContract']);
            Route::get('/projects/{project}/amendments', [ClientPortalController::class, 'amendments']);
            Route::patch('/amendments/{amendment}/status', [ClientPortalController::class, 'respondToAmendment']);
            Route::get('/quotes', [ClientPortalQuoteController::class, 'index']);
            Route::get('/quotes/{quote}', [ClientPortalQuoteController::class, 'show']);
            Route::get('/quotes/{quote}/preview', [ClientPortalQuoteController::class, 'preview']);
            Route::post('/quotes/{quote}/accept', [ClientPortalQuoteController::class, 'accept']);
            Route::get('/messages/threads', [ClientPortalMessageController::class, 'threads']);
            Route::get('/messages/thread', [ClientPortalMessageController::class, 'thread']);
            Route::post('/messages', [ClientPortalMessageController::class, 'store']);
            Route::get('/tickets', [ClientPortalTicketController::class, 'index']);
            Route::post('/tickets', [ClientPortalTicketController::class, 'store']);
            Route::get('/tickets/{ticket}', [ClientPortalTicketController::class, 'show']);
            Route::post('/tickets/{ticket}/messages', [ClientPortalTicketController::class, 'storeMessage']);
        });

        Route::prefix('super-admin')->middleware('super_admin')->group(function (): void {
            Route::get('/tenants', [SuperAdminController::class, 'index']);
            Route::get('/stats', [SuperAdminController::class, 'stats']);
            Route::post('/tenants', [SuperAdminController::class, 'store']);
            Route::patch('/tenants/{tenant}', [SuperAdminController::class, 'update']);
            Route::post('/tenants/{tenant}/admins', [SuperAdminController::class, 'storeAdmin']);
            Route::patch('/tenants/{tenant}/status', [SuperAdminController::class, 'updateStatus']);
            Route::patch('/tenants/{tenant}/admins/{user}/status', [SuperAdminController::class, 'updateAdminStatus']);
            Route::get('/tenants/{tenant}/admins/{user}/credentials', [SuperAdminController::class, 'showAdminCredentials']);
            Route::post('/tenants/{tenant}/admins/{user}/reset-password', [SuperAdminController::class, 'resetAdminPassword']);
            Route::get('/demo-codes', [SuperAdminDemoCodeController::class, 'index']);
            Route::post('/demo-codes', [SuperAdminDemoCodeController::class, 'store']);
            Route::delete('/demo-codes/{demoCode}', [SuperAdminDemoCodeController::class, 'destroy']);
            Route::get('/demo-requests', [SuperAdminDemoRequestController::class, 'index']);
            Route::patch('/demo-requests/{demoRequest}', [SuperAdminDemoRequestController::class, 'update']);
            Route::delete('/demo-requests/{demoRequest}', [SuperAdminDemoRequestController::class, 'destroy']);
            Route::get('/homepage', [SuperAdminHomepageController::class, 'show']);
            Route::put('/homepage', [SuperAdminHomepageController::class, 'update']);
            Route::post('/homepage/hero-background', [SuperAdminHomepageController::class, 'storeHeroBackground']);
            Route::delete('/homepage/hero-background', [SuperAdminHomepageController::class, 'destroyHeroBackground']);
            Route::post('/homepage/partners', [SuperAdminHomepageController::class, 'storePartner']);
            Route::delete('/homepage/partners/{partner}', [SuperAdminHomepageController::class, 'destroyPartner']);
            Route::post('/homepage/cards/{card}/image', [SuperAdminHomepageController::class, 'storeCardImage']);
            Route::delete('/homepage/cards/{card}/image', [SuperAdminHomepageController::class, 'destroyCardImage']);
        });

        Route::get('/team/tenant-options', [TeamController::class, 'tenantOptions']);
        Route::get('/team/members', [TeamController::class, 'index']);
        Route::patch('/team/members/{user}/status', [TeamController::class, 'toggleStatus']);
        Route::patch('/team/members/{user}/archive', [TeamController::class, 'archive']);

        Route::prefix('messaging')->group(function (): void {
            Route::get('/threads', [MessagingController::class, 'threads']);
            Route::get('/conversations/{clientUser}', [MessagingController::class, 'thread']);
            Route::post('/messages', [MessagingController::class, 'store']);
        });

        Route::middleware('company')->group(function (): void {
            Route::get('/search', GlobalSearchController::class)
                ->middleware('permission:dashboard.view');

            Route::get('/dashboard/summary', [DashboardController::class, 'summary'])
                ->middleware('permission:dashboard.view');

            Route::get('/company/users', [CompanyUserController::class, 'index'])
                ->middleware('permission:project.view');

            Route::post('/team/members', [TeamController::class, 'store'])
                ->middleware('permission:user.create');
            Route::patch('/team/members/{user}/role', [TeamController::class, 'updateRole'])
                ->middleware('permission:user.update');

            Route::get('/clients', [ClientController::class, 'index'])
                ->middleware('permission:client.view');
            Route::post('/clients', [ClientController::class, 'store'])
                ->middleware('permission:client.create');
            Route::get('/clients/{client}', [ClientController::class, 'show'])
                ->middleware('permission:client.view');
            Route::put('/clients/{client}', [ClientController::class, 'update'])
                ->middleware('permission:client.update');
            Route::delete('/clients/{client}', [ClientController::class, 'destroy'])
                ->middleware('permission:client.delete');
            Route::patch('/clients/{client}/archive', [ClientController::class, 'archive'])
                ->middleware('permission:client.delete');
            Route::patch('/clients/{client}/portal-status', [ClientController::class, 'togglePortalStatus'])
                ->middleware(['admin', 'permission:client.update']);
            Route::post('/clients/{client}/contacts', [ClientContactController::class, 'store'])
                ->middleware('permission:client.update');
            Route::put('/client-contacts/{clientContact}', [ClientContactController::class, 'update'])
                ->middleware('permission:client.update');
            Route::delete('/client-contacts/{clientContact}', [ClientContactController::class, 'destroy'])
                ->middleware('permission:client.update');

            Route::get('/badges', [BadgeController::class, 'index'])
                ->middleware('permission:client.view');
            Route::post('/badges', [BadgeController::class, 'store'])
                ->middleware('permission:role.manage');
            Route::put('/badges/{badge}', [BadgeController::class, 'update'])
                ->middleware('permission:role.manage');
            Route::delete('/badges/{badge}', [BadgeController::class, 'destroy'])
                ->middleware('permission:role.manage');

            Route::get('/theme-colors', [ThemeColorController::class, 'index'])
                ->middleware('permission:client.view');
            Route::put('/theme-colors', [ThemeColorController::class, 'update'])
                ->middleware(['admin', 'permission:role.manage']);

            Route::get('/tenant/logo', [TenantSettingsController::class, 'showLogo'])
                ->middleware('admin');
            Route::post('/tenant/logo', [TenantSettingsController::class, 'updateLogo'])
                ->middleware('admin');
            Route::delete('/tenant/logo', [TenantSettingsController::class, 'destroyLogo'])
                ->middleware('admin');

            Route::get('/tenant/document-controls', [TenantSettingsController::class, 'showDocumentControls'])
                ->middleware('admin');
            Route::put('/tenant/document-controls', [TenantSettingsController::class, 'updateDocumentControls'])
                ->middleware('admin');

            Route::get('/lots', [LotController::class, 'index'])
                ->middleware('permission:project.view');
            Route::post('/lots', [LotController::class, 'store'])
                ->middleware('permission:role.manage');
            Route::put('/lots/{lot}', [LotController::class, 'update'])
                ->middleware('permission:role.manage');
            Route::delete('/lots/{lot}', [LotController::class, 'destroy'])
                ->middleware('permission:role.manage');

            Route::get('/sectors', [SectorController::class, 'index'])
                ->middleware('permission:project.view');
            Route::post('/sectors', [SectorController::class, 'store'])
                ->middleware('permission:role.manage');
            Route::put('/sectors/{sector}', [SectorController::class, 'update'])
                ->middleware('permission:role.manage');
            Route::delete('/sectors/{sector}', [SectorController::class, 'destroy'])
                ->middleware('permission:role.manage');

            Route::get('/projects', [ProjectController::class, 'index'])
                ->middleware('permission:project.view');
            Route::post('/projects', [ProjectController::class, 'store'])
                ->middleware(['permission:project.create', 'admin']);
            Route::get('/projects/{project}', [ProjectController::class, 'show'])
                ->middleware('permission:project.view');
            Route::put('/projects/{project}', [ProjectController::class, 'update'])
                ->middleware(['permission:project.update', 'admin']);
            Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])
                ->middleware(['permission:project.delete', 'admin']);

            Route::get('/projects/{project}/import/template', [ProjectImportController::class, 'template'])
                ->middleware('permission:project.view');
            Route::post('/projects/{project}/import', [ProjectImportController::class, 'import'])
                ->middleware('permission:project.update');

            Route::get('/projects/{project}/phases', [ProjectPhaseController::class, 'index'])
                ->middleware('permission:project.view');
            Route::post('/projects/{project}/phases', [ProjectPhaseController::class, 'store'])
                ->middleware('permission:project.update');
            Route::put('/phases/{phase}', [ProjectPhaseController::class, 'update'])
                ->middleware('permission:project.update');
            Route::delete('/phases/{phase}', [ProjectPhaseController::class, 'destroy'])
                ->middleware('permission:project.update');

            Route::post('/phases/{phase}/tasks', [TaskController::class, 'store'])
                ->middleware('permission:project.update');
            Route::put('/tasks/{task}', [TaskController::class, 'update'])
                ->middleware('permission:project.update');
            Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])
                ->middleware('permission:project.update');

            Route::post('/projects/{project}/team', [ProjectTeamController::class, 'store'])
                ->middleware(['permission:project.update', 'admin']);
            Route::patch('/projects/{project}/team/{user}/toggle-chat', [ProjectTeamController::class, 'toggleChat'])
                ->middleware(['permission:project.update', 'admin']);
            Route::delete('/projects/{project}/team/{user}', [ProjectTeamController::class, 'destroy'])
                ->middleware(['permission:project.update', 'admin']);

            Route::get('/projects/{project}/progress', [ProjectProgressController::class, 'index'])
                ->middleware('permission:project.view');
            Route::post('/projects/{project}/progress', [ProjectProgressController::class, 'store'])
                ->middleware('permission:project.update');

            Route::get('/document-types', [DocumentTypeController::class, 'index'])
                ->middleware('permission:document.view');
            Route::post('/document-types', [DocumentTypeController::class, 'store'])
                ->middleware('permission:role.manage');
            Route::put('/document-types/{documentType}', [DocumentTypeController::class, 'update'])
                ->middleware('permission:role.manage');
            Route::delete('/document-types/{documentType}', [DocumentTypeController::class, 'destroy'])
                ->middleware('permission:role.manage');

            Route::get('/projects/{project}/documents', [DocumentController::class, 'index'])
                ->middleware('permission:document.view');
            Route::post('/projects/{project}/documents', [DocumentController::class, 'store'])
                ->middleware('permission:document.upload');
            Route::get('/documents/{document}/download', [DocumentController::class, 'download'])
                ->middleware('permission:document.view');
            Route::put('/documents/{document}/archive', [DocumentController::class, 'archive'])
                ->middleware('permission:document.archive');

            Route::post('/projects/{project}/media', [ProjectMediaController::class, 'store'])
                ->middleware('permission:project.update');

            Route::get('/projects/{project}/expenses', [ExpenseController::class, 'index'])
                ->middleware('permission:expense.view');
            Route::post('/projects/{project}/expenses', [ExpenseController::class, 'store'])
                ->middleware('permission:expense.manage');
            Route::put('/expenses/{expense}', [ExpenseController::class, 'update'])
                ->middleware('permission:expense.manage');
            Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy'])
                ->middleware('permission:expense.manage');

            Route::get('/projects/{project}/amendments', [ContractAmendmentController::class, 'index'])
                ->middleware('permission:project.view');
            Route::post('/projects/{project}/amendments', [ContractAmendmentController::class, 'store'])
                ->middleware('permission:project.update');
            Route::put('/amendments/{amendment}', [ContractAmendmentController::class, 'update'])
                ->middleware('permission:project.update');
            Route::patch('/amendments/{amendment}/status', [ContractAmendmentController::class, 'updateStatus'])
                ->middleware('permission:project.update');
            Route::delete('/amendments/{amendment}', [ContractAmendmentController::class, 'destroy'])
                ->middleware('permission:project.update');
            Route::get('/amendments/{amendment}/download', [ContractAmendmentController::class, 'download'])
                ->middleware('permission:project.view');

            Route::get('/quotes', [QuoteController::class, 'index'])
                ->middleware('permission:quote.view');
            Route::post('/quotes', [QuoteController::class, 'store'])
                ->middleware('permission:quote.manage');
            Route::get('/quotes/{quote}', [QuoteController::class, 'show'])
                ->middleware('permission:quote.view');
            Route::get('/quotes/{quote}/document-preview', [CommercialDocumentController::class, 'quotePreview'])
                ->middleware('permission:quote.view');
            Route::post('/quotes/{quote}/increment-print', [QuoteController::class, 'incrementPrint'])
                ->middleware('permission:quote.view');
            Route::put('/quotes/{quote}', [QuoteController::class, 'update'])
                ->middleware('permission:quote.manage');
            Route::delete('/quotes/{quote}', [QuoteController::class, 'destroy'])
                ->middleware('permission:quote.manage');
            Route::post('/quotes/{quote}/convert-to-invoice', [QuoteController::class, 'convertToInvoice'])
                ->middleware('permission:invoice.manage');

            Route::get('/tickets', [TicketController::class, 'index'])
                ->middleware('permission:ticket.view');
            Route::post('/tickets', [TicketController::class, 'store'])
                ->middleware('permission:ticket.create');
            Route::get('/tickets/{ticket}', [TicketController::class, 'show'])
                ->middleware('permission:ticket.view');
            Route::post('/tickets/{ticket}/messages', [TicketController::class, 'storeMessage'])
                ->middleware('permission:ticket.reply');
            Route::post('/tickets/{ticket}/close', [TicketController::class, 'close'])
                ->middleware('permission:ticket.close');
            Route::post('/quotes/{quote}/lines', [QuoteLineController::class, 'store'])
                ->middleware('permission:quote.manage');
            Route::put('/quote-lines/{quoteLine}', [QuoteLineController::class, 'update'])
                ->middleware('permission:quote.manage');
            Route::delete('/quote-lines/{quoteLine}', [QuoteLineController::class, 'destroy'])
                ->middleware('permission:quote.manage');

            Route::get('/delivery-forms', [DeliveryFormController::class, 'index'])
                ->middleware('permission:delivery_form.view');
            Route::post('/delivery-forms', [DeliveryFormController::class, 'store'])
                ->middleware('permission:delivery_form.manage');
            Route::get('/delivery-forms/{deliveryForm}', [DeliveryFormController::class, 'show'])
                ->middleware('permission:delivery_form.view');
            Route::get('/delivery-forms/{deliveryForm}/document-preview', [CommercialDocumentController::class, 'deliveryFormPreview'])
                ->middleware('permission:delivery_form.view');
            Route::put('/delivery-forms/{deliveryForm}', [DeliveryFormController::class, 'update'])
                ->middleware('permission:delivery_form.manage');
            Route::delete('/delivery-forms/{deliveryForm}', [DeliveryFormController::class, 'destroy'])
                ->middleware('permission:delivery_form.manage');

            Route::get('/dispatch-notes', [DispatchNoteController::class, 'index'])
                ->middleware('permission:delivery_form.view');
            Route::post('/dispatch-notes', [DispatchNoteController::class, 'store'])
                ->middleware('permission:delivery_form.manage');
            Route::get('/dispatch-notes/{dispatchNote}', [DispatchNoteController::class, 'show'])
                ->middleware('permission:delivery_form.view');
            Route::post('/dispatch-notes/{dispatchNote}/execute', [DispatchNoteController::class, 'execute'])
                ->middleware('permission:delivery_form.manage');

            Route::post('/prints/track', [PrintTrackingController::class, 'track'])
                ->middleware('permission:project.view');

            Route::post('/quotes/{quote}/convert-to-delivery-form', [QuoteController::class, 'convertToDeliveryForm'])
                ->middleware('permission:delivery_form.manage');

            Route::get('/invoices', [InvoiceController::class, 'index'])
                ->middleware('permission:invoice.view');
            Route::post('/invoices', [InvoiceController::class, 'store'])
                ->middleware('permission:invoice.manage');
            Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])
                ->middleware('permission:invoice.view');
            Route::get('/invoices/{invoice}/document-preview', [CommercialDocumentController::class, 'invoicePreview'])
                ->middleware('permission:invoice.view');
            Route::post('/invoices/{invoice}/increment-print', [InvoiceController::class, 'incrementPrint'])
                ->middleware('permission:invoice.view');
            Route::put('/invoices/{invoice}', [InvoiceController::class, 'update'])
                ->middleware('permission:invoice.manage');
            Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])
                ->middleware('permission:invoice.manage');
            Route::post('/invoices/{invoice}/lines', [InvoiceLineController::class, 'store'])
                ->middleware('permission:invoice.manage');
            Route::put('/invoice-lines/{invoiceLine}', [InvoiceLineController::class, 'update'])
                ->middleware('permission:invoice.manage');
            Route::delete('/invoice-lines/{invoiceLine}', [InvoiceLineController::class, 'destroy'])
                ->middleware('permission:invoice.manage');
            Route::post('/invoices/{invoice}/payments', [PaymentController::class, 'store'])
                ->middleware('permission:payment.record');
            Route::delete('/payments/{payment}', [PaymentController::class, 'destroy'])
                ->middleware('permission:payment.record');

            Route::get('/permissions', [PermissionController::class, 'index'])
                ->middleware('permission:role.view');
            Route::get('/roles/settings', [RoleController::class, 'settings'])
                ->middleware('permission:role.view');
            Route::get('/roles', [RoleController::class, 'index'])
                ->middleware('permission:role.view');
            Route::post('/roles', [RoleController::class, 'store'])
                ->middleware('permission:role.manage');
            Route::put('/roles/{role}', [RoleController::class, 'update'])
                ->middleware('permission:role.manage');
            Route::delete('/roles/{role}', [RoleController::class, 'destroy'])
                ->middleware('permission:role.manage');

            Route::get('/activity-logs', [ActivityLogController::class, 'index'])
                ->middleware('permission:dashboard.view');

            Route::get('/audit-logs', [AuditLogController::class, 'index'])
                ->middleware('permission:dashboard.view');
            Route::post('/audit-logs', [AuditLogController::class, 'store'])
                ->middleware('permission:dashboard.view');
            Route::delete('/audit-logs/{audit_log}', [AuditLogController::class, 'destroy'])
                ->middleware('permission:dashboard.view');

            Route::get('/document-templates/placeholders', [DocumentTemplateController::class, 'placeholders'])
                ->middleware('permission:role.manage');
            Route::get('/document-templates', [DocumentTemplateController::class, 'index'])
                ->middleware('permission:role.manage');
            Route::post('/document-templates', [DocumentTemplateController::class, 'store'])
                ->middleware('permission:role.manage');
            Route::get('/document-templates/{documentTemplate}', [DocumentTemplateController::class, 'show'])
                ->middleware('permission:role.manage');
            Route::put('/document-templates/{documentTemplate}', [DocumentTemplateController::class, 'update'])
                ->middleware('permission:role.manage');
            Route::delete('/document-templates/{documentTemplate}', [DocumentTemplateController::class, 'destroy'])
                ->middleware('permission:role.manage');
            Route::get('/document-templates/{documentTemplate}/preview', [DocumentTemplateController::class, 'preview'])
                ->middleware('permission:role.manage');

            Route::get('/contract-templates', [ContractTemplateController::class, 'index'])
                ->middleware('permission:role.manage');
            Route::post('/contract-templates', [ContractTemplateController::class, 'store'])
                ->middleware('permission:role.manage');
            Route::get('/contract-templates/{contractTemplate}', [ContractTemplateController::class, 'show'])
                ->middleware('permission:role.manage');
            Route::put('/contract-templates/{contractTemplate}', [ContractTemplateController::class, 'update'])
                ->middleware('permission:role.manage');
            Route::delete('/contract-templates/{contractTemplate}', [ContractTemplateController::class, 'destroy'])
                ->middleware('permission:role.manage');
            Route::get('/contract-templates/{contractTemplate}/preview', [ContractTemplateController::class, 'preview'])
                ->middleware('permission:role.manage');

            Route::get('/contracts', [ContractController::class, 'index'])
                ->middleware('permission:project.view');
            Route::post('/contracts/compile', [ContractController::class, 'compile'])
                ->middleware('permission:project.update');
            Route::get('/contracts/{contract}', [ContractController::class, 'show'])
                ->middleware('permission:project.view');
            Route::post('/contracts/{contract}/tenant-signature', [ContractController::class, 'submitTenantSignature'])
                ->middleware(['admin', 'permission:project.update']);
        });
    });
});
