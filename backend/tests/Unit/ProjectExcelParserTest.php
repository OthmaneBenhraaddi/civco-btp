<?php

namespace Tests\Unit;

use App\Enums\TaskStatus;
use App\Services\ProjectImport\ProjectExcelParser;
use App\Services\ProjectImport\ProjectExcelTemplateService;
use App\Support\ProjectImport\ProjectImportSchema;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use Tests\TestCase;

class ProjectExcelParserTest extends TestCase
{
    public function test_template_has_locked_headers_and_expected_columns(): void
    {
        $spreadsheet = app(ProjectExcelTemplateService::class)->buildSpreadsheet();
        $sheet = $spreadsheet->getSheetByName(ProjectImportSchema::DATA_SHEET);

        $this->assertNotNull($sheet);
        $this->assertTrue($sheet->getProtection()->getSheet());
        $this->assertNotNull($spreadsheet->getSheetByName(ProjectImportSchema::HELP_SHEET));

        foreach (ProjectImportSchema::headers() as $index => $header) {
            $letter = ProjectImportSchema::columnLetter($index);
            $this->assertSame($header, $sheet->getCell($letter.'1')->getValue());
        }

        $spreadsheet->disconnectWorksheets();
    }

    public function test_valid_rows_are_parsed_with_numeric_and_date_values(): void
    {
        $spreadsheet = $this->workbookWithRows([
            ['Gros œuvre', 'Fondations', 'Fouilles', 'm³', 45, 850, '01/09/2026', '20/09/2026', 'À faire'],
            ['Second œuvre', 'Menuiseries', null, 'u', '18,5', '3200,00', '16/10/2026', '30/10/2026', 'En cours'],
        ]);

        $result = app(ProjectExcelParser::class)->parseSpreadsheet($spreadsheet);

        $this->assertTrue(
            $result->isValid(),
            json_encode(array_map(fn ($error) => $error->toArray(), $result->errors), JSON_UNESCAPED_UNICODE),
        );
        $this->assertCount(2, $result->rows);
        $this->assertSame('Gros œuvre', $result->rows[0]->phase);
        $this->assertSame(45.0, $result->rows[0]->quantity);
        $this->assertSame(850.0, $result->rows[0]->unitPrice);
        $this->assertSame('2026-09-01', $result->rows[0]->plannedStartDate?->toDateString());
        $this->assertSame(TaskStatus::InProgress, $result->rows[1]->status);
        $this->assertEqualsWithDelta(18.5, $result->rows[1]->quantity, 0.001);
    }

    public function test_invalid_number_and_date_report_row_and_column(): void
    {
        $spreadsheet = $this->workbookWithRows([
            ['Gros œuvre', 'Fondations', null, 'm³', 'abc', 850, '01/09/2026', 'pas-une-date', 'À faire'],
        ]);

        $result = app(ProjectExcelParser::class)->parseSpreadsheet($spreadsheet);

        $this->assertFalse($result->isValid());
        $this->assertSame([], $result->rows);
        $messages = array_map(fn ($error) => $error->toArray(), $result->errors);

        $this->assertTrue(collect($messages)->contains(
            fn (array $error) => $error['row'] === 2 && $error['column'] === 'E' && str_contains($error['message'], 'nombre'),
        ));
        $this->assertTrue(collect($messages)->contains(
            fn (array $error) => $error['row'] === 2 && $error['column'] === 'H' && str_contains($error['message'], 'date'),
        ));
    }

    public function test_missing_required_column_is_reported_on_header_row(): void
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(ProjectImportSchema::DATA_SHEET);
        $sheet->setCellValue('A1', 'Phase');
        $sheet->setCellValue('B1', 'Quantité');
        $sheet->setCellValue('A2', 'Terrassement');
        $sheet->setCellValue('B2', 10);

        $result = app(ProjectExcelParser::class)->parseSpreadsheet($spreadsheet);

        $this->assertFalse($result->isValid());
        $this->assertTrue(collect($result->errors)->contains(
            fn ($error) => $error->row === 1 && str_contains($error->message, 'Intitulé'),
        ));
    }

    public function test_empty_worksheet_returns_no_data_error(): void
    {
        $spreadsheet = app(ProjectExcelTemplateService::class)->buildSpreadsheet();
        $result = app(ProjectExcelParser::class)->parseSpreadsheet($spreadsheet);

        $this->assertFalse($result->isValid());
        $this->assertNotEmpty($result->errors);
        $this->assertStringContainsString('Aucune ligne', $result->errors[0]->message);
    }

    /**
     * @param  list<list<mixed>>  $rows
     */
    private function workbookWithRows(array $rows): \PhpOffice\PhpSpreadsheet\Spreadsheet
    {
        $spreadsheet = app(ProjectExcelTemplateService::class)->buildSpreadsheet();
        $sheet = $spreadsheet->getSheetByName(ProjectImportSchema::DATA_SHEET);

        foreach ($rows as $rowIndex => $values) {
            foreach ($values as $colIndex => $value) {
                if ($value === null) {
                    continue;
                }
                $letter = ProjectImportSchema::columnLetter($colIndex);
                $sheet->setCellValue($letter.($rowIndex + 2), $value);
            }
        }

        return $spreadsheet;
    }
}
