<?php

namespace App\Dto\ProjectImport;

final readonly class ImportResult
{
    /**
     * @param  list<ImportError>  $errors
     * @param  list<ImportRow>  $rows
     */
    public function __construct(
        public array $errors,
        public array $rows,
    ) {}

    public function isValid(): bool
    {
        return $this->errors === [] && $this->rows !== [];
    }
}
