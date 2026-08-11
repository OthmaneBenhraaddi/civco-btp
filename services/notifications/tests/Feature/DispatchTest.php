<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class DispatchTest extends TestCase
{
    public function test_health_is_public(): void
    {
        $this->getJson('/health')
            ->assertOk()
            ->assertJson([
                'status' => 'ok',
                'service' => 'notifications',
            ]);
    }

    public function test_dispatch_requires_internal_token(): void
    {
        $this->postJson('/internal/v1/dispatch', [
            'recipients' => [['user_id' => 1, 'email' => 'a@test.ma']],
            'title' => 'Test',
            'message' => 'Hello',
        ])->assertUnauthorized();
    }

    public function test_dispatch_queues_in_app_and_sends_email(): void
    {
        Mail::fake();

        $response = $this->withToken('civco-internal-secret')
            ->postJson('/internal/v1/dispatch', [
                'recipients' => [
                    [
                        'user_id' => 12,
                        'tenant_id' => 3,
                        'email' => 'chef@civco.ma',
                        'name' => 'Chef Chantier',
                    ],
                ],
                'title' => 'Avenant en attente',
                'message' => 'Un avenant attend votre validation.',
                'type' => 'amendment_pending',
                'action_path' => '/portal',
                'channels' => ['in_app', 'email'],
                'mail_subject' => 'CivCo — avenant',
            ]);

        $response->assertOk()
            ->assertJsonPath('in_app', 1)
            ->assertJsonPath('email', 1)
            ->assertJsonPath('dispatched', 2);
    }
}
