<?php

namespace App\Dto\Documents;

final readonly class RenderResponse
{
    public function __construct(
        public string $html,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            html: (string) ($data['html'] ?? ''),
        );
    }

    /**
     * @return array{html: string}
     */
    public function toArray(): array
    {
        return [
            'html' => $this->html,
        ];
    }
}
