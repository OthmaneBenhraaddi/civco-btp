<?php

namespace App\Services\ProjectImport;

use App\Support\ProjectImport\ProjectImportSchema;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Protection;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ProjectExcelTemplateService
{
    public function buildBinary(): string
    {
        $spreadsheet = $this->buildSpreadsheet();
        $writer = new Xlsx($spreadsheet);

        $temp = tempnam(sys_get_temp_dir(), 'civco-xlsx-');
        if ($temp === false) {
            throw new \RuntimeException('Impossible de créer un fichier temporaire.');
        }

        try {
            $writer->save($temp);
            $contents = file_get_contents($temp);
        } finally {
            @unlink($temp);
            $spreadsheet->disconnectWorksheets();
        }

        if ($contents === false) {
            throw new \RuntimeException('Impossible de générer le modèle Excel.');
        }

        return $contents;
    }

    public function buildSpreadsheet(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(ProjectImportSchema::DATA_SHEET);

        $headers = ProjectImportSchema::headers();
        $lastCol = ProjectImportSchema::columnLetter(count($headers) - 1);

        foreach ($headers as $index => $header) {
            $letter = ProjectImportSchema::columnLetter($index);
            $sheet->setCellValue($letter.'1', $header);
        }

        $sheet->freezePane('A2');
        $sheet->setAutoFilter("A1:{$lastCol}1");
        $sheet->getRowDimension(1)->setRowHeight(22);

        $sheet->getStyle("A1:{$lastCol}1")->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1F2937'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '111827'],
                ],
            ],
            'protection' => ['locked' => Protection::PROTECTION_PROTECTED],
        ]);

        $lastDataRow = ProjectImportSchema::MAX_ROWS + 1;
        $sheet->getStyle("A2:{$lastCol}{$lastDataRow}")->getProtection()
            ->setLocked(Protection::PROTECTION_UNPROTECTED);

        $sheet->getStyle("E2:F{$lastDataRow}")->getNumberFormat()->setFormatCode('#,##0.00');
        $sheet->getStyle("G2:H{$lastDataRow}")->getNumberFormat()->setFormatCode('DD/MM/YYYY');

        foreach (range(0, count($headers) - 1) as $index) {
            $sheet->getColumnDimension(ProjectImportSchema::columnLetter($index))->setAutoSize(true);
        }

        $this->addListValidation($sheet, "I2:I{$lastDataRow}", 'À faire,En cours,Terminé,Bloqué');
        $this->addListValidation($sheet, "D2:D{$lastDataRow}", 'u,m²,m³,ml,kg,t,h,forfait,ens');

        $protection = $sheet->getProtection();
        $protection->setSheet(true);
        $protection->setInsertRows(false);
        $protection->setDeleteRows(false);
        $protection->setInsertColumns(false);
        $protection->setDeleteColumns(false);

        $this->addHelpSheet($spreadsheet);

        $spreadsheet->setActiveSheetIndex(0);

        return $spreadsheet;
    }

    private function addListValidation($sheet, string $range, string $formula): void
    {
        $validation = $sheet->getCell(explode(':', $range)[0])->getDataValidation();
        $validation->setType(DataValidation::TYPE_LIST);
        $validation->setErrorStyle(DataValidation::STYLE_STOP);
        $validation->setAllowBlank(true);
        $validation->setShowDropDown(true);
        $validation->setFormula1('"'.$formula.'"');
        $validation->setShowErrorMessage(true);
        $validation->setErrorTitle('Valeur invalide');
        $validation->setError('Choisissez une valeur dans la liste.');
        $sheet->setDataValidation($range, $validation);
    }

    private function addHelpSheet(Spreadsheet $spreadsheet): void
    {
        $help = $spreadsheet->createSheet();
        $help->setTitle(ProjectImportSchema::HELP_SHEET);
        $help->setCellValue('A1', 'Mode d\'emploi — import chantier CivCo');
        $help->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $lines = [
            '1. Renseignez uniquement l\'onglet « Chantier ». La ligne 1 (en-têtes) est verrouillée.',
            '2. Colonnes obligatoires : Phase, Intitulé.',
            '3. Quantité et Prix unitaire HT doivent être numériques (virgule ou point).',
            '4. Dates au format JJ/MM/AAAA. La date de fin ne peut pas précéder la date de début.',
            '5. Statut accepté : À faire, En cours, Terminé, Bloqué (défaut : À faire).',
            '6. Les phases existantes sont réutilisées (même nom). Sinon elles sont créées.',
            '7. L\'import est transactionnel : aucune ligne n\'est enregistrée s\'il y a une erreur.',
            '',
            'Exemple :',
            'Phase | Intitulé | Unité | Quantité | Prix unitaire HT | Date début prévue | Date fin prévue | Statut',
            'Gros œuvre | Fondations isolées | m³ | 45 | 850 | 01/09/2026 | 20/09/2026 | À faire',
            'Gros œuvre | Élévation murs RDC | m² | 220 | 420 | 21/09/2026 | 15/10/2026 | À faire',
            'Second œuvre | Menuiseries extérieures | u | 18 | 3200 | 16/10/2026 | 30/10/2026 | À faire',
        ];

        foreach ($lines as $index => $line) {
            $help->setCellValue('A'.($index + 3), $line);
        }

        $help->getColumnDimension('A')->setWidth(120);
        $help->getProtection()->setSheet(true);
    }
}
