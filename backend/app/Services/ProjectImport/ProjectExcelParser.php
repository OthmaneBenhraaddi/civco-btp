<?php

namespace App\Services\ProjectImport;

use App\Dto\ProjectImport\ImportError;
use App\Dto\ProjectImport\ImportResult;
use App\Dto\ProjectImport\ImportRow;
use App\Enums\TaskStatus;
use App\Support\ProjectImport\ProjectImportSchema;
use Carbon\CarbonImmutable;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Throwable;

class ProjectExcelParser
{
    public function parseFile(string $path): ImportResult
    {
        try {
            $reader = IOFactory::createReaderForFile($path);
            $reader->setReadDataOnly(false);
            $spreadsheet = $reader->load($path);
        } catch (Throwable) {
            return new ImportResult([
                new ImportError(0, '-', 'Fichier', 'Le fichier n\'est pas un classeur Excel .xlsx valide.'),
            ], []);
        }

        try {
            return $this->parseSpreadsheet($spreadsheet);
        } finally {
            $spreadsheet->disconnectWorksheets();
        }
    }

    public function parseSpreadsheet(Spreadsheet $spreadsheet): ImportResult
    {
        $sheet = $spreadsheet->getSheetByName(ProjectImportSchema::DATA_SHEET)
            ?? $spreadsheet->getSheet(0);

        $map = $this->mapHeaders($sheet);
        if ($map['errors'] !== []) {
            return new ImportResult($map['errors'], []);
        }

        /** @var array<string, array{letter: string, header: string, index: int}> $columns */
        $columns = $map['columns'];
        $errors = [];
        $rows = [];
        $highestRow = min((int) $sheet->getHighestDataRow(), ProjectImportSchema::MAX_ROWS + 1);

        for ($row = 2; $row <= $highestRow; $row++) {
            $raw = [];
            foreach ($columns as $key => $meta) {
                $raw[$key] = $this->cellValue($sheet, $meta['letter'].$row);
            }

            if ($this->isBlank($raw['phase'] ?? null) && $this->isBlank($raw['title'] ?? null)) {
                continue;
            }

            $parsed = $this->parseRow($row, $raw, $columns);
            $errors = array_merge($errors, $parsed['errors']);

            if ($parsed['row'] instanceof ImportRow) {
                $rows[] = $parsed['row'];
            }
        }

        if ($rows === [] && $errors === []) {
            $errors[] = new ImportError(
                0,
                '-',
                'Fichier',
                'Aucune ligne de données à importer. Renseignez au moins un poste dans l\'onglet « Chantier ».',
            );
        }

        return new ImportResult($errors, $errors === [] ? $rows : []);
    }

    /**
     * @return array{columns: array<string, array{letter: string, header: string, index: int}>, errors: list<ImportError>}
     */
    private function mapHeaders(Worksheet $sheet): array
    {
        $highestColumnIndex = min(
            Coordinate::columnIndexFromString($sheet->getHighestColumn()),
            20,
        );

        $found = [];
        for ($col = 1; $col <= $highestColumnIndex; $col++) {
            $letter = ProjectImportSchema::columnLetter($col - 1);
            $header = trim((string) $sheet->getCell($letter.'1')->getValue());
            if ($header === '') {
                continue;
            }
            $found[ProjectImportSchema::normalize($header)] = [
                'letter' => $letter,
                'header' => $header,
                'index' => $col - 1,
            ];
        }

        $columns = [];
        $errors = [];

        foreach (ProjectImportSchema::columns() as $definition) {
            $matched = null;
            foreach ($definition['aliases'] as $alias) {
                $normalized = ProjectImportSchema::normalize($alias);
                if (isset($found[$normalized])) {
                    $matched = $found[$normalized];
                    break;
                }
            }

            if ($matched === null) {
                if ($definition['required']) {
                    $errors[] = new ImportError(
                        1,
                        '-',
                        $definition['header'],
                        'Colonne obligatoire manquante : « '.$definition['header'].' ».',
                    );
                }

                continue;
            }

            $columns[$definition['key']] = $matched;
        }

        return ['columns' => $columns, 'errors' => $errors];
    }

    /**
     * @param  array<string, mixed>  $raw
     * @param  array<string, array{letter: string, header: string, index: int}>  $columns
     * @return array{row: ?ImportRow, errors: list<ImportError>}
     */
    private function parseRow(int $rowNumber, array $raw, array $columns): array
    {
        $errors = [];

        $phase = $this->asRequiredString($raw['phase'] ?? null, $rowNumber, $columns['phase'] ?? $this->fallbackMeta('Phase', 'A'), 150, $errors);
        $title = $this->asRequiredString($raw['title'] ?? null, $rowNumber, $columns['title'] ?? $this->fallbackMeta('Intitulé', 'B'), 200, $errors);

        $description = $this->asOptionalString($raw['description'] ?? null);
        $unit = $this->asOptionalString($raw['unit'] ?? null);
        if ($unit !== null && mb_strlen($unit) > 20) {
            $meta = $columns['unit'] ?? $this->fallbackMeta('Unité', 'D');
            $errors[] = new ImportError($rowNumber, $meta['letter'], $meta['header'], 'L\'unité ne peut pas dépasser 20 caractères.');
            $unit = null;
        }

        $quantity = $this->asOptionalNumber(
            $raw['quantity'] ?? null,
            $rowNumber,
            $columns['quantity'] ?? $this->fallbackMeta('Quantité', 'E'),
            $errors,
            min: 0,
        );
        $unitPrice = $this->asOptionalNumber(
            $raw['unit_price'] ?? null,
            $rowNumber,
            $columns['unit_price'] ?? $this->fallbackMeta('Prix unitaire HT', 'F'),
            $errors,
        );

        $start = $this->asOptionalDate(
            $raw['planned_start_date'] ?? null,
            $rowNumber,
            $columns['planned_start_date'] ?? $this->fallbackMeta('Date début prévue', 'G'),
            $errors,
        );
        $end = $this->asOptionalDate(
            $raw['planned_end_date'] ?? null,
            $rowNumber,
            $columns['planned_end_date'] ?? $this->fallbackMeta('Date fin prévue', 'H'),
            $errors,
        );

        if ($start !== null && $end !== null && $end->lt($start)) {
            $meta = $columns['planned_end_date'] ?? $this->fallbackMeta('Date fin prévue', 'H');
            $errors[] = new ImportError(
                $rowNumber,
                $meta['letter'],
                $meta['header'],
                'La date de fin prévue ne peut pas être antérieure à la date de début.',
            );
        }

        $status = $this->asStatus(
            $raw['status'] ?? null,
            $rowNumber,
            $columns['status'] ?? $this->fallbackMeta('Statut', 'I'),
            $errors,
        );

        if ($errors !== [] || $phase === null || $title === null) {
            return ['row' => null, 'errors' => $errors];
        }

        return [
            'row' => new ImportRow(
                rowNumber: $rowNumber,
                phase: $phase,
                title: $title,
                description: $description,
                unit: $unit,
                quantity: $quantity,
                unitPrice: $unitPrice,
                plannedStartDate: $start,
                plannedEndDate: $end,
                status: $status,
            ),
            'errors' => [],
        ];
    }

    /**
     * @param  list<ImportError>  $errors
     * @param  array{letter: string, header: string, index: int}  $meta
     */
    private function asRequiredString(mixed $value, int $row, array $meta, int $max, array &$errors): ?string
    {
        $text = $this->asOptionalString($value);
        if ($text === null || $text === '') {
            $errors[] = new ImportError($row, $meta['letter'], $meta['header'], 'Valeur obligatoire manquante.');

            return null;
        }

        if (mb_strlen($text) > $max) {
            $errors[] = new ImportError($row, $meta['letter'], $meta['header'], "Texte trop long (max. {$max} caractères).");

            return null;
        }

        return $text;
    }

    private function asOptionalString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }

    /**
     * @param  list<ImportError>  $errors
     * @param  array{letter: string, header: string, index: int}  $meta
     */
    private function asOptionalNumber(mixed $value, int $row, array $meta, array &$errors, ?float $min = null): ?float
    {
        if ($this->isBlank($value)) {
            return null;
        }

        if (is_int($value) || is_float($value)) {
            $number = (float) $value;
        } else {
            $normalized = str_replace(["\u{00A0}", ' '], '', trim((string) $value));
            $normalized = str_replace(',', '.', $normalized);
            if (! is_numeric($normalized)) {
                $errors[] = new ImportError(
                    $row,
                    $meta['letter'],
                    $meta['header'],
                    'Type invalide : un nombre est attendu.',
                );

                return null;
            }
            $number = (float) $normalized;
        }

        if ($min !== null && $number < $min) {
            $errors[] = new ImportError(
                $row,
                $meta['letter'],
                $meta['header'],
                'La valeur ne peut pas être inférieure à '.$min.'.',
            );

            return null;
        }

        return $number;
    }

    /**
     * @param  list<ImportError>  $errors
     * @param  array{letter: string, header: string, index: int}  $meta
     */
    private function asOptionalDate(mixed $value, int $row, array $meta, array &$errors): ?CarbonImmutable
    {
        if ($this->isBlank($value)) {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return CarbonImmutable::instance(\DateTimeImmutable::createFromInterface($value))->startOfDay();
        }

        if (is_int($value) || is_float($value)) {
            try {
                return CarbonImmutable::instance(ExcelDate::excelToDateTimeObject((float) $value))->startOfDay();
            } catch (Throwable) {
                $errors[] = new ImportError($row, $meta['letter'], $meta['header'], 'Type invalide : une date est attendue (JJ/MM/AAAA).');

                return null;
            }
        }

        $text = trim((string) $value);
        foreach (['d/m/Y', 'Y-m-d', 'd-m-Y', 'd.m.Y'] as $format) {
            try {
                $parsed = CarbonImmutable::createFromFormat('!'.$format, $text);
            } catch (Throwable) {
                continue;
            }

            if ($parsed !== false) {
                return $parsed->startOfDay();
            }
        }

        $errors[] = new ImportError($row, $meta['letter'], $meta['header'], 'Type invalide : une date est attendue (JJ/MM/AAAA).');

        return null;
    }

    /**
     * @param  list<ImportError>  $errors
     * @param  array{letter: string, header: string, index: int}  $meta
     */
    private function asStatus(mixed $value, int $row, array $meta, array &$errors): TaskStatus
    {
        if ($this->isBlank($value)) {
            return TaskStatus::Todo;
        }

        $normalized = ProjectImportSchema::normalize((string) $value);

        $status = match ($normalized) {
            'todo', 'a faire', 'à faire', 'a_faire', 'afaire' => TaskStatus::Todo,
            'in_progress', 'en cours', 'encours', 'in progress' => TaskStatus::InProgress,
            'done', 'termine', 'terminé', 'fait', 'finie', 'fini' => TaskStatus::Done,
            'blocked', 'bloque', 'bloqué' => TaskStatus::Blocked,
            default => null,
        };

        if ($status === null) {
            $errors[] = new ImportError(
                $row,
                $meta['letter'],
                $meta['header'],
                'Statut invalide. Valeurs : À faire, En cours, Terminé, Bloqué.',
            );

            return TaskStatus::Todo;
        }

        return $status;
    }

    private function cellValue(Worksheet $sheet, string $coordinate): mixed
    {
        $cell = $sheet->getCell($coordinate);

        if (ExcelDate::isDateTime($cell)) {
            $value = $cell->getValue();
            if (is_int($value) || is_float($value)) {
                return ExcelDate::excelToDateTimeObject((float) $value);
            }
        }

        $value = $cell->getValue();

        if (is_string($value) && str_starts_with($value, '=')) {
            $value = $cell->getCalculatedValue();
        }

        return $value instanceof Cell ? $value->getValue() : $value;
    }

    private function isBlank(mixed $value): bool
    {
        if ($value === null) {
            return true;
        }

        if ($value instanceof \DateTimeInterface) {
            return false;
        }

        return trim((string) $value) === '';
    }

    /**
     * @return array{letter: string, header: string, index: int}
     */
    private function fallbackMeta(string $header, string $letter): array
    {
        return ['letter' => $letter, 'header' => $header, 'index' => ord($letter) - ord('A')];
    }
}
