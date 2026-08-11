<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function (): void {
    $this->comment('documents renderer');
})->purpose('Health ping for artisan');
