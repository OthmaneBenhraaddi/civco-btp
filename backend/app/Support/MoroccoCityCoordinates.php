<?php

namespace App\Support;

/**
 * Offline coordinates for major Moroccan cities.
 * Used when Nominatim is unreachable (local dev SSL) or returns no street match.
 */
final class MoroccoCityCoordinates
{
    /** @var array<string, array{lat: float, lon: float, label: string}> */
    private const CITIES = [
        'mohammedia' => ['lat' => 33.6958383, 'lon' => -7.3893292, 'label' => 'Mohammédia'],
        'casablanca' => ['lat' => 33.5731, 'lon' => -7.5898, 'label' => 'Casablanca'],
        'rabat' => ['lat' => 34.0209, 'lon' => -6.8416, 'label' => 'Rabat'],
        'tanger' => ['lat' => 35.7595, 'lon' => -5.8340, 'label' => 'Tanger'],
        'marrakech' => ['lat' => 31.6295, 'lon' => -7.9811, 'label' => 'Marrakech'],
        'fes' => ['lat' => 34.0181, 'lon' => -5.0078, 'label' => 'Fès'],
        'agadir' => ['lat' => 30.4278, 'lon' => -9.5981, 'label' => 'Agadir'],
        'meknes' => ['lat' => 33.8935, 'lon' => -5.5473, 'label' => 'Meknès'],
        'oujda' => ['lat' => 34.6814, 'lon' => -1.9086, 'label' => 'Oujda'],
        'kenitra' => ['lat' => 34.2610, 'lon' => -6.5802, 'label' => 'Kénitra'],
        'tetouan' => ['lat' => 35.5889, 'lon' => -5.3626, 'label' => 'Tétouan'],
        'sale' => ['lat' => 34.0531, 'lon' => -6.7985, 'label' => 'Salé'],
        'nador' => ['lat' => 35.1681, 'lon' => -2.9333, 'label' => 'Nador'],
        'settat' => ['lat' => 33.0017, 'lon' => -7.6167, 'label' => 'Settat'],
        'berrechid' => ['lat' => 33.2655, 'lon' => -7.5875, 'label' => 'Berrechid'],
        'khouribga' => ['lat' => 32.8848, 'lon' => -6.9064, 'label' => 'Khouribga'],
        'eljadida' => ['lat' => 33.2316, 'lon' => -8.5007, 'label' => 'El Jadida'],
        'taza' => ['lat' => 34.2139, 'lon' => -4.0086, 'label' => 'Taza'],
        'larache' => ['lat' => 35.1871, 'lon' => -6.1557, 'label' => 'Larache'],
        'khemisset' => ['lat' => 33.8244, 'lon' => -6.0661, 'label' => 'Khémisset'],
        'guelmim' => ['lat' => 28.9867, 'lon' => -10.0574, 'label' => 'Guelmim'],
        'benimellal' => ['lat' => 32.3373, 'lon' => -6.3498, 'label' => 'Béni Mellal'],
        'errachidia' => ['lat' => 31.9319, 'lon' => -4.4246, 'label' => 'Errachidia'],
        'tiznit' => ['lat' => 29.6974, 'lon' => -9.7316, 'label' => 'Tiznit'],
        'essaouira' => ['lat' => 31.5085, 'lon' => -9.7595, 'label' => 'Essaouira'],
    ];

  /**
     * @return array{lat: float, lon: float, label: string}|null
     */
    public static function resolve(?string $city): ?array
    {
        $key = self::normalizeCityKey($city);

        if ($key === null) {
            return null;
        }

        return self::CITIES[$key] ?? null;
    }

    public static function normalizeCityKey(?string $city): ?string
    {
        if ($city === null) {
            return null;
        }

        $trimmed = trim($city);

        if ($trimmed === '') {
            return null;
        }

        $lower = mb_strtolower($trimmed, 'UTF-8');
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $lower);

        if ($ascii === false) {
            $ascii = $lower;
        }

        $key = preg_replace('/[^a-z]/', '', $ascii);

        return $key === '' ? null : $key;
    }
}
