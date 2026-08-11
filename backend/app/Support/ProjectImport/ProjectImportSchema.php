<?php

namespace App\Support\ProjectImport;

final class ProjectImportSchema
{
    public const DATA_SHEET = 'Chantier';

    public const HELP_SHEET = 'Aide';

    public const MAX_ROWS = 500;

    /**
     * @return list<array{key: string, header: string, required: bool, aliases: list<string>}>
     */
    public static function columns(): array
    {
        return [
            [
                'key' => 'phase',
                'header' => 'Phase',
                'required' => true,
                'aliases' => ['phase', 'phase du chantier', 'lot'],
            ],
            [
                'key' => 'title',
                'header' => 'Intitulé',
                'required' => true,
                'aliases' => ['intitule', 'intitulé', 'titre', 'tache', 'tâche', 'poste', 'designation', 'désignation'],
            ],
            [
                'key' => 'description',
                'header' => 'Description',
                'required' => false,
                'aliases' => ['description', 'details', 'détails', 'notes'],
            ],
            [
                'key' => 'unit',
                'header' => 'Unité',
                'required' => false,
                'aliases' => ['unite', 'unité', 'u', 'unit'],
            ],
            [
                'key' => 'quantity',
                'header' => 'Quantité',
                'required' => false,
                'aliases' => ['quantite', 'quantité', 'qty', 'qte', 'qté'],
            ],
            [
                'key' => 'unit_price',
                'header' => 'Prix unitaire HT',
                'required' => false,
                'aliases' => ['prix unitaire ht', 'prix unitaire', 'pu ht', 'pu', 'prix'],
            ],
            [
                'key' => 'planned_start_date',
                'header' => 'Date début prévue',
                'required' => false,
                'aliases' => ['date debut prevue', 'date début prévue', 'debut', 'début', 'start date', 'date debut'],
            ],
            [
                'key' => 'planned_end_date',
                'header' => 'Date fin prévue',
                'required' => false,
                'aliases' => ['date fin prevue', 'date fin prévue', 'fin', 'echeance', 'échéance', 'due date', 'date fin'],
            ],
            [
                'key' => 'status',
                'header' => 'Statut',
                'required' => false,
                'aliases' => ['statut', 'status', 'etat', 'état'],
            ],
        ];
    }

    /**
     * @return list<string>
     */
    public static function headers(): array
    {
        return array_column(self::columns(), 'header');
    }

    public static function columnLetter(int $index): string
    {
        return chr(ord('A') + $index);
    }

    public static function normalize(string $value): string
    {
        $value = trim(mb_strtolower($value));
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        $ascii = is_string($ascii) ? strtolower($ascii) : $value;
        $ascii = preg_replace('/[^a-z0-9]+/', ' ', $ascii) ?? $ascii;

        return trim(preg_replace('/\s+/', ' ', $ascii) ?? $ascii);
    }
}
