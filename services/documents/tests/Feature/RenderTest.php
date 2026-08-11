<?php

namespace Tests\Feature;

use Tests\TestCase;

class RenderTest extends TestCase
{
    public function test_health_is_public(): void
    {
        $this->getJson('/health')
            ->assertOk()
            ->assertJson([
                'status' => 'ok',
                'service' => 'documents',
            ]);
    }

    public function test_render_requires_internal_token(): void
    {
        $this->postJson('/internal/v1/render', [
            'template_html' => 'Hi {{name}}',
            'variables' => ['name' => 'CivCo'],
        ])->assertUnauthorized();
    }

    public function test_render_compiles_template_with_header_and_watermark(): void
    {
        $response = $this->withToken('civco-internal-secret')
            ->postJson('/internal/v1/render', [
                'template_html' => '<p>Client {{client_name}}</p>',
                'variables' => ['client_name' => 'Al Omrane'],
                'options' => [
                    'header' => true,
                    'header_html' => '<header>CivCo</header>',
                    'watermark' => 'COPIE - NON OFFICIEL',
                ],
            ]);

        $response->assertOk();

        $html = $response->json('html');

        $this->assertIsString($html);
        $this->assertStringContainsString('<header>CivCo</header>', $html);
        $this->assertStringContainsString('<p>Client Al Omrane</p>', $html);
        $this->assertStringContainsString('COPIE - NON OFFICIEL', $html);
        $this->assertStringContainsString('document-watermark', $html);
    }
}
