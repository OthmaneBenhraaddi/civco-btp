<?php

namespace App\Dto\ProjectImport;

final readonly class ImportError
{
    public function __construct(
        public int $row,
        public string $column,
        public string $header,
        public string $message,
    ) {}

    /**
     * @return array{row: int, column: string, header: string, message: string}
     */
    public function toArray(): array
    {
        return [
            'row' => $this->row,
            'column' => $this->column,
            'header' => $this->header,
            'message' => $this->message,
        ];
    }
}
