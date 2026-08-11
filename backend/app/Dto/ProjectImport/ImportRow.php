<?php

namespace App\Dto\ProjectImport;

use App\Enums\TaskStatus;
use Carbon\CarbonImmutable;

final readonly class ImportRow
{
    public function __construct(
        public int $rowNumber,
        public string $phase,
        public string $title,
        public ?string $description,
        public ?string $unit,
        public ?float $quantity,
        public ?float $unitPrice,
        public ?CarbonImmutable $plannedStartDate,
        public ?CarbonImmutable $plannedEndDate,
        public TaskStatus $status,
    ) {}
}
