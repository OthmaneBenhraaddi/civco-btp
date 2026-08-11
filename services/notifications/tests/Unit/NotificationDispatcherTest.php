<?php

namespace Tests\Unit;

use App\Dispatching\NotificationDispatcher;
use App\Dto\DispatchRecipient;
use App\Dto\DispatchRequest;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class NotificationDispatcherTest extends TestCase
{
    public function test_in_app_only_does_not_send_mail(): void
    {
        Mail::fake();

        $result = (new NotificationDispatcher)->dispatch(new DispatchRequest(
            recipients: [new DispatchRecipient(userId: 1, email: 'a@test.ma')],
            title: 'Alerte',
            message: 'Chantier retardé',
            channels: ['in_app'],
        ));

        $this->assertSame(1, $result->inApp);
        $this->assertSame(0, $result->email);
        Mail::assertNothingSent();
    }
}
