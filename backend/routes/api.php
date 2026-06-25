<?php

use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BadgeController;
use App\Http\Controllers\Api\V1\ClientContactController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\CompanyUserController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DeliveryFormController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\DocumentTypeController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\LotController;
use App\Http\Controllers\Api\V1\InvoiceLineController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\QuoteController;
use App\Http\Controllers\Api\V1\QuoteLineController;
use App\Http\Controllers\Api\V1\ProjectPhaseController;
use App\Http\Controllers\Api\V1\ProjectProgressController;
use App\Http\Controllers\Api\V1\ProjectTeamController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SectorController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\ThemeColorController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', fn () => response()->json([
        'status' => 'ok',
        'service' => 'btp-backend',
    ]));

    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::put('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);

        Route::middleware('company')->group(function (): void {
            Route::get('/dashboard/summary', [DashboardController::class, 'summary'])
                ->middleware('permission:dashboard.view');

            Route::get('/company/users', [CompanyUserController::class, 'index'])
                ->middleware('permission:project.view');

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

            Route::get('/projects/{project}/expenses', [ExpenseController::class, 'index'])
                ->middleware('permission:expense.view');
            Route::post('/projects/{project}/expenses', [ExpenseController::class, 'store'])
                ->middleware('permission:expense.manage');
            Route::put('/expenses/{expense}', [ExpenseController::class, 'update'])
                ->middleware('permission:expense.manage');
            Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy'])
                ->middleware('permission:expense.manage');

            Route::get('/quotes', [QuoteController::class, 'index'])
                ->middleware('permission:quote.view');
            Route::post('/quotes', [QuoteController::class, 'store'])
                ->middleware('permission:quote.manage');
            Route::get('/quotes/{quote}', [QuoteController::class, 'show'])
                ->middleware('permission:quote.view');
            Route::post('/quotes/{quote}/increment-print', [QuoteController::class, 'incrementPrint'])
                ->middleware('permission:quote.view');
            Route::put('/quotes/{quote}', [QuoteController::class, 'update'])
                ->middleware('permission:quote.manage');
            Route::delete('/quotes/{quote}', [QuoteController::class, 'destroy'])
                ->middleware('permission:quote.manage');
            Route::post('/quotes/{quote}/convert-to-invoice', [QuoteController::class, 'convertToInvoice'])
                ->middleware('permission:invoice.manage');
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
            Route::put('/delivery-forms/{deliveryForm}', [DeliveryFormController::class, 'update'])
                ->middleware('permission:delivery_form.manage');
            Route::delete('/delivery-forms/{deliveryForm}', [DeliveryFormController::class, 'destroy'])
                ->middleware('permission:delivery_form.manage');
            Route::post('/quotes/{quote}/convert-to-delivery-form', [QuoteController::class, 'convertToDeliveryForm'])
                ->middleware('permission:delivery_form.manage');

            Route::get('/invoices', [InvoiceController::class, 'index'])
                ->middleware('permission:invoice.view');
            Route::post('/invoices', [InvoiceController::class, 'store'])
                ->middleware('permission:invoice.manage');
            Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])
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

            Route::get('/roles', [RoleController::class, 'index'])
                ->middleware('permission:role.view');
            Route::post('/roles', [RoleController::class, 'store'])
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
        });
    });
});
