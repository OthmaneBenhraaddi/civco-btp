<?php

use App\Http\Controllers\DispatchController;
use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::middleware('internal')->group(function (): void {
    Route::post('/internal/v1/dispatch', DispatchController::class);
});
