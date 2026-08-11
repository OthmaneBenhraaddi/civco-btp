<?php

namespace App\Providers;

use App\Contracts\Documents\DocumentRenderer;
use App\Contracts\Notifications\NotificationDispatcher;
use App\Models\Project;
use App\Models\Task;
use App\Observers\ProjectObserver;
use App\Observers\TaskObserver;
use App\Services\Documents\HttpDocumentRenderer;
use App\Services\Documents\LocalDocumentRenderer;
use App\Services\Notifications\HttpNotificationDispatcher;
use App\Services\Notifications\LocalNotificationDispatcher;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LocalDocumentRenderer::class);

        $this->app->singleton(DocumentRenderer::class, function ($app): DocumentRenderer {
            $local = $app->make(LocalDocumentRenderer::class);
            $url = config('services.document_renderer.url');

            if (! filled($url)) {
                return $local;
            }

            return new HttpDocumentRenderer(
                localFallback: $local,
                baseUrl: rtrim((string) $url, '/'),
                token: (string) config('services.document_renderer.token', ''),
                timeout: (int) config('services.document_renderer.timeout', 10),
            );
        });

        $this->app->singleton(LocalNotificationDispatcher::class);

        $this->app->singleton(NotificationDispatcher::class, function ($app): NotificationDispatcher {
            $local = $app->make(LocalNotificationDispatcher::class);
            $url = config('services.notification_dispatcher.url');

            if (! filled($url)) {
                return $local;
            }

            return new HttpNotificationDispatcher(
                localFallback: $local,
                baseUrl: rtrim((string) $url, '/'),
                token: (string) config('services.notification_dispatcher.token', ''),
                timeout: (int) config('services.notification_dispatcher.timeout', 10),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Project::observe(ProjectObserver::class);
        Task::observe(TaskObserver::class);
    }
}
