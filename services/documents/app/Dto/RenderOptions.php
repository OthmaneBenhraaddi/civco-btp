<?php

namespace App\Dto;

final readonly class RenderOptions
{
    public function __construct(
        public bool $header = false,
        public ?string $headerHtml = null,
        public ?string $watermark = null,
        public string $locale = 'fr',
        public ?string $signatureHtml = null,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $headerHtml = $data['header_html'] ?? null;
        $watermark = $data['watermark'] ?? null;
        $signatureHtml = $data['signature_html'] ?? null;

        return new self(
            header: (bool) ($data['header'] ?? false),
            headerHtml: is_string($headerHtml) && $headerHtml !== '' ? $headerHtml : null,
            watermark: is_string($watermark) && $watermark !== '' ? $watermark : null,
            locale: (string) ($data['locale'] ?? 'fr'),
            signatureHtml: is_string($signatureHtml) && $signatureHtml !== '' ? $signatureHtml : null,
        );
    }
}
