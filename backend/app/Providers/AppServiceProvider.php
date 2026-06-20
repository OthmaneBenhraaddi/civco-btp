<?php

namespace App\Providers;

use App\Console\Commands\ServeCommand;
use Illuminate\Foundation\Console\ServeCommand as BaseServeCommand;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->app->forgetInstance(BaseServeCommand::class);
        $this->app->singleton(BaseServeCommand::class, fn () => new ServeCommand);
    }
}
