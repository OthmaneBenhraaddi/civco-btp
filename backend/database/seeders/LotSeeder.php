<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Lot;
use App\Models\Sector;
use Illuminate\Database\Seeder;

class LotSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            'VRD' => [
                'ROUTE',
                'LES OUVRAGE HYDRAULIQUES (LES PONTS + LES DALOTS + LES BUSES)',
                'ASSAINISSEMENT (LIQUIDE + EAUX PLUVIALES)',
                'ECLAIRAGE PUBLICS',
                'RESEAU INFORMATIQUE (BORNE WIFI)',
                'AMENAGEMENT (PAVE + BANC + FONTAINE)',
            ],
            'BÂTIMENT' => [
                'Béton Armé (B.A)',
                'ELECTRICITE',
                'PLOMBERIE',
                'DETECTION ICENDIE',
                'PROTECTION INCENDIE',
                'VENTILLATION',
                'CLIMATISATION',
                'RESEAU INFO',
                'VISEO SURVEILLANCE',
                'DESENFUMAGE',
                'EAU POTABLE',
                'ACCOSTIQUE',
            ],
            'Génie Civil' => [
                'Terrassement',
                'Fondations spéciales',
                'Ouvrages d\'art',
            ],
        ];

        Company::query()->each(function (Company $company) use ($catalog): void {
            foreach ($catalog as $sectorName => $names) {
                $sector = Sector::query()->firstOrCreate(
                    ['company_id' => $company->id, 'name' => $sectorName],
                );

                foreach ($names as $name) {
                    Lot::query()->updateOrCreate(
                        [
                            'company_id' => $company->id,
                            'name' => $name,
                        ],
                        ['sector_id' => $sector->id],
                    );
                }
            }
        });
    }
}
