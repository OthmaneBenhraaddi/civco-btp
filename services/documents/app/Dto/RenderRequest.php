<?php

namespace App\Dto;

final readonly class RenderRequest
{
    /**
     * @param  array<string, scalar|null>  $variables
     */
    public function __construct(
        public string $templateHtml,
        public array $variables = [],
        public RenderOptions $options = new RenderOptions(),
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $variables = $data['variables'] ?? [];

        return new self(
            templateHtml: (string) ($data['template_html'] ?? ''),
            variables: is_array($variables) ? $variables : [],
            options: RenderOptions::fromArray(is_array($data['options'] ?? null) ? $data['options'] : []),
        );
    }
}
