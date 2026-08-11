<?php

namespace Tests\Unit;

use App\Rendering\TemplateCompiler;
use PHPUnit\Framework\TestCase;

class TemplateCompilerTest extends TestCase
{
    public function test_it_replaces_mustache_and_brace_placeholders(): void
    {
        $html = TemplateCompiler::compile(
            'Bonjour {{ client_name }} — {project_title}',
            [
                'client_name' => 'Atlas Immobilier',
                'project_title' => 'Résidence Nord',
            ],
        );

        $this->assertSame('Bonjour Atlas Immobilier — Résidence Nord', $html);
    }

    public function test_it_leaves_unknown_placeholders_intact(): void
    {
        $html = TemplateCompiler::compile('Hello {unknown}', []);

        $this->assertSame('Hello {unknown}', $html);
    }
}
