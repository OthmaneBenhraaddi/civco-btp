<?php

namespace Tests\Unit;

use App\Contracts\Notifications\NotificationDispatcher;
use App\Dto\Notifications\DispatchRecipient;
use App\Dto\Notifications\DispatchRequest;
use App\Enums\NotificationType;
use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\Notifications\HttpNotificationDispatcher;
use App\Services\Notifications\LocalNotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class NotificationDispatcherTest extends TestCase
{
    use RefreshDatabase;

    public function test_local_dispatcher_is_bound_by_default(): void
    {
        $this->assertInstanceOf(LocalNotificationDispatcher::class, app(NotificationDispatcher::class));
    }

    public function test_local_dispatcher_stores_in_app_notification(): void
    {
        Mail::fake();
        $this->seed();

        $user = User::query()->where('email', 'admin@civco.ma')->firstOrFail();

        $response = app(LocalNotificationDispatcher::class)->dispatch(new DispatchRequest(
            recipients: [
                new DispatchRecipient(
                    userId: (int) $user->id,
                    tenantId: $user->tenant_id,
                    email: $user->email,
                    name: $user->full_name,
                ),
            ],
            title: 'Alerte chantier',
            message: 'Retard sur le lot gros œuvre.',
            type: NotificationType::ProjectAlert->value,
            actionPath: '/projects/1',
            channels: ['in_app', 'email'],
        ));

        $this->assertSame(1, $response->inApp);
        $this->assertSame(1, $response->email);
        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $user->id,
            'title' => 'Alerte chantier',
            'type' => 'project_alert',
        ]);
    }

    public function test_notification_service_dispatches_through_bound_dispatcher(): void
    {
        $this->seed();
        $user = User::query()->where('email', 'admin@civco.ma')->firstOrFail();

        $notification = app(NotificationService::class)->notify(
            $user,
            $user->tenant_id,
            'Devis signé',
            'Le client a signé.',
            NotificationType::QuoteSigned,
            '/quotes/1',
        );

        $this->assertInstanceOf(Notification::class, $notification);
        $this->assertSame('quote_signed', $notification->type->value);
    }

    public function test_http_dispatcher_uses_remote_when_available(): void
    {
        $this->seed();
        $user = User::query()->where('email', 'admin@civco.ma')->firstOrFail();

        Http::fake([
            'http://notifications.test/internal/v1/dispatch' => Http::response([
                'dispatched' => 2,
                'in_app' => 1,
                'email' => 1,
                'deliveries' => [],
            ], 200),
        ]);

        $dispatcher = new HttpNotificationDispatcher(
            localFallback: app(LocalNotificationDispatcher::class),
            baseUrl: 'http://notifications.test',
            token: 'secret',
            timeout: 2,
        );

        $response = $dispatcher->dispatch(new DispatchRequest(
            recipients: [
                new DispatchRecipient(
                    userId: (int) $user->id,
                    tenantId: $user->tenant_id,
                    email: $user->email,
                ),
            ],
            title: 'Remote OK',
            message: 'Payload',
            channels: ['in_app', 'email'],
        ));

        $this->assertSame(1, $response->inApp);
        $this->assertSame(1, $response->email);
        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $user->id,
            'title' => 'Remote OK',
        ]);
        Http::assertSentCount(1);
    }

    public function test_http_dispatcher_falls_back_to_local_on_error(): void
    {
        Mail::fake();
        $this->seed();
        $user = User::query()->where('email', 'admin@civco.ma')->firstOrFail();

        Http::fake([
            'http://notifications.test/*' => Http::response(['message' => 'down'], 503),
        ]);

        $dispatcher = new HttpNotificationDispatcher(
            localFallback: app(LocalNotificationDispatcher::class),
            baseUrl: 'http://notifications.test',
            token: 'secret',
            timeout: 2,
        );

        $response = $dispatcher->dispatch(new DispatchRequest(
            recipients: [
                new DispatchRecipient(
                    userId: (int) $user->id,
                    tenantId: $user->tenant_id,
                    email: $user->email,
                ),
            ],
            title: 'Fallback local',
            message: 'Service down',
            channels: ['in_app'],
        ));

        $this->assertSame(1, $response->inApp);
        $this->assertDatabaseHas('user_notifications', [
            'title' => 'Fallback local',
            'user_id' => $user->id,
        ]);
    }
}
