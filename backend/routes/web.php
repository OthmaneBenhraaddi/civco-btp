<?php

use App\Http\Controllers\Web\TenantEntryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes (tenant subdomain when TENANCY_SUBDOMAIN_ROUTING=true)
|--------------------------------------------------------------------------
|
| Served on: https://{subdomain}.monerp.com/
| Registered via routes/tenancy.php
|
*/

Route::get('/login', [TenantEntryController::class, 'login'])->name('login');
Route::get('/', [TenantEntryController::class, 'home'])->name('home');
