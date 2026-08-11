<?php

use App\Http\Controllers\HealthController;
use App\Http\Controllers\RenderController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::middleware('internal')->group(function (): void {
    Route::post('/internal/v1/render', RenderController::class);
});
