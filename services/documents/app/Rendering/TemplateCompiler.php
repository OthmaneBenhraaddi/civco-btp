<?php

namespace App\Rendering;

/**
 * Pure token replacement + optional watermark wrap.
 * Keep in sync with backend/app/Services/Documents/TemplateCompiler.php
 */
final class TemplateCompiler
{
    /**
     * @param  array<string, scalar|null>  $variables
     */
    public static function compile(string $template, array $variables): string
    {
        $normalized = [];

        foreach ($variables as $key => $value) {
            $normalized[(string) $key] = (string) ($value ?? '');
        }

        $compiled = preg_replace_callback(
            '/\{\{\s*([\w.]+)\s*\}\}|\{\s*([\w.]+)\s*\}/',
            static function (array $matches) use ($normalized): string {
                $key = $matches[1] !== '' ? $matches[1] : $matches[2];

                return $normalized[$key] ?? $matches[0];
            },
            $template,
        );

        return $compiled ?? $template;
    }

    public static function wrapWatermark(string $html, string $watermark): string
    {
        $label = htmlspecialchars($watermark, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        return <<<HTML
<div class="document-render-root" style="position:relative;">
  <div class="document-watermark" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0.12;font-size:64px;font-weight:800;letter-spacing:0.08em;transform:rotate(-24deg);white-space:nowrap;color:#0f172a;">{$label}</div>
  <div class="document-render-body">{$html}</div>
</div>
HTML;
    }
}
