<?php

namespace App\Dto;

final readonly class RenderResponse
{
    public function __construct(
        public string $html,
    ) {}

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
