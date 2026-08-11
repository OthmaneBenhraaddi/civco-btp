<?php

namespace App\Rendering;

use App\Dto\RenderRequest;
use App\Dto\RenderResponse;

final class DocumentRenderer
{
    public function render(RenderRequest $request): RenderResponse
    {
        $html = TemplateCompiler::compile($request->templateHtml, $request->variables);
        $options = $request->options;

        if ($options->header && filled($options->headerHtml)) {
            $html = $options->headerHtml.$html;
        }

        if (filled($options->signatureHtml)) {
            $html .= $options->signatureHtml;
        }

        if (filled($options->watermark)) {
            $html = TemplateCompiler::wrapWatermark($html, $options->watermark);
        }

        return new RenderResponse($html);
    }
}
