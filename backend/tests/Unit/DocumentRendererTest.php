<?php

namespace Tests\Unit;

use App\Contracts\Documents\DocumentRenderer;
use App\Dto\Documents\RenderOptions;
use App\Dto\Documents\RenderRequest;
use App\Services\Documents\HttpDocumentRenderer;
use App\Services\Documents\LocalDocumentRenderer;
use App\Services\Documents\TemplateCompiler;
use App\Services\DocumentTemplateService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DocumentRendererTest extends TestCase
{
    public function test_local_renderer_is_bound_by_default(): void
    {
        $this->assertInstanceOf(LocalDocumentRenderer::class, app(DocumentRenderer::class));
    }

    public function test_template_compiler_matches_legacy_placeholder_syntax(): void
    {
        $html = TemplateCompiler::compile(
            'Devis {{reference}} pour {client_name}',
            [
                'reference' => 'CIV-DEV-001',
                'client_name' => 'Atlas',
            ],
        );

        $this->assertSame('Devis CIV-DEV-001 pour Atlas', $html);
    }

    public function test_document_template_service_compiles_through_the_renderer(): void
    {
        $html = app(DocumentTemplateService::class)->compile(
            'Total {{total_ttc}} MAD',
            ['total_ttc' => '1 250,00'],
        );

        $this->assertSame('Total 1 250,00 MAD', $html);
    }

    public function test_local_renderer_prepends_header_and_watermark(): void
    {
        $html = app(LocalDocumentRenderer::class)->render(new RenderRequest(
            templateHtml: '<p>{title}</p>',
            variables: ['title' => 'Contrat'],
            options: new RenderOptions(
                header: true,
                headerHtml: '<header>BET</header>',
                watermark: 'COPIE',
            ),
        ))->html;

        $this->assertStringContainsString('<header>BET</header>', $html);
        $this->assertStringContainsString('<p>Contrat</p>', $html);
        $this->assertStringContainsString('COPIE', $html);
    }

    public function test_http_renderer_uses_remote_html_when_available(): void
    {
        Http::fake([
            'http://documents.test/internal/v1/render' => Http::response(['html' => '<p>remote</p>'], 200),
        ]);

        $renderer = new HttpDocumentRenderer(
            localFallback: app(LocalDocumentRenderer::class),
            baseUrl: 'http://documents.test',
            token: 'secret',
            timeout: 2,
        );

        $html = $renderer->render(new RenderRequest(
            templateHtml: 'unused {{name}}',
            variables: ['name' => 'local'],
        ))->html;

        $this->assertSame('<p>remote</p>', $html);
    }

    public function test_http_renderer_falls_back_to_local_on_error(): void
    {
        Http::fake([
            'http://documents.test/*' => Http::response(['message' => 'down'], 503),
        ]);

        $renderer = new HttpDocumentRenderer(
            localFallback: app(LocalDocumentRenderer::class),
            baseUrl: 'http://documents.test',
            token: 'secret',
            timeout: 2,
        );

        $html = $renderer->render(new RenderRequest(
            templateHtml: 'Hi {{name}}',
            variables: ['name' => 'CivCo'],
        ))->html;

        $this->assertSame('Hi CivCo', $html);
    }
}
