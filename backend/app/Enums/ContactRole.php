<?php

namespace App\Enums;

enum ContactRole: string
{
    case Commercial = 'commercial';
    case Comptable = 'comptable';
    case ChefDeProjet = 'chef_de_projet';
    case Technique = 'technique';
    case Direction = 'direction';
    case Autre = 'autre';

    public function label(): string
    {
        return match ($this) {
            self::Commercial => 'Commercial',
            self::Comptable => 'Comptable',
            self::ChefDeProjet => 'Chef de projet',
            self::Technique => 'Technique',
            self::Direction => 'Direction',
            self::Autre => 'Autre',
        };
    }
}
