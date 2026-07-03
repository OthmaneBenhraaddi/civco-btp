<?php

namespace App\Services;

use App\Support\MoroccoCityCoordinates;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SiteGeocodingService
{
    private const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

    /**
     * @return array{site_address: string, latitude: float, longitude: float}|null
     */
    public function resolveFromParts(?string $line1, ?string $city, ?string $postalCode): ?array
    {
        $line1 = $this->cleanPart($line1);
        $city = $this->cleanPart($city);
        $postalCode = $this->cleanPart($postalCode);

        $local = trim(implode(', ', array_filter([
            $line1,
            trim(implode(' ', array_filter([$postalCode, $city]))),
        ])));

        if ($local === '') {
            return null;
        }

        foreach ($this->onlineAttempts($line1, $city, $postalCode) as $params) {
            $coordinates = $this->searchCoordinates($params);

            if ($coordinates !== null) {
                return $this->result($local, $coordinates['latitude'], $coordinates['longitude']);
            }
        }

        $offline = MoroccoCityCoordinates::resolve($city);

        if ($offline !== null) {
            Log::info('Site geocoding used offline city fallback', [
                'city' => $city,
                'label' => $offline['label'],
            ]);

            return $this->result($local, $offline['lat'], $offline['lon']);
        }

        return null;
    }

    /**
     * @return list<array<string, string>>
     */
    private function onlineAttempts(?string $line1, ?string $city, ?string $postalCode): array
    {
        if ($city === null) {
            return $line1 !== null
                ? [['q' => "{$line1}, Morocco", 'countrycodes' => 'ma']]
                : [];
        }

        $offlineCity = MoroccoCityCoordinates::resolve($city);
        $cityNames = array_values(array_unique(array_filter([
            $city,
            $offlineCity['label'] ?? null,
        ])));

        $attempts = [];

        foreach ($cityNames as $cityName) {
            if ($postalCode !== null) {
                $attempts[] = [
                    'city' => $cityName,
                    'postalcode' => $postalCode,
                    'countrycodes' => 'ma',
                ];
            }

            $attempts[] = ['q' => "{$cityName}, Morocco", 'countrycodes' => 'ma'];

            if ($line1 !== null) {
                $postalCity = trim(implode(' ', array_filter([$postalCode, $cityName])));
                $attempts[] = ['q' => "{$line1}, {$postalCity}, Morocco", 'countrycodes' => 'ma'];
            }
        }

        return $this->uniqueAttempts($attempts);
    }

    /**
     * @return array{site_address: string, latitude: float, longitude: float}
     */
    private function result(string $local, float $latitude, float $longitude): array
    {
        return [
            'site_address' => $local,
            'latitude' => $latitude,
            'longitude' => $longitude,
        ];
    }

    private function cleanPart(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    /**
     * @param  list<array<string, string>>  $attempts
     * @return list<array<string, string>>
     */
    private function uniqueAttempts(array $attempts): array
    {
        $seen = [];
        $unique = [];

        foreach ($attempts as $params) {
            $params = array_filter($params, fn ($value) => $value !== null && $value !== '');
            ksort($params);
            $key = json_encode($params);

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $unique[] = $params;
        }

        return $unique;
    }

    /**
     * @param  array<string, string>  $params
     * @return array{latitude: float, longitude: float}|null
     */
    private function searchCoordinates(array $params): ?array
    {
        try {
            $response = Http::timeout(12)
                ->retry(1, 500)
                ->withOptions([
                    'verify' => $this->verifySsl(),
                ])
                ->withHeaders([
                    'User-Agent' => $this->userAgent(),
                    'Accept-Language' => 'fr,en',
                ])
                ->get(self::NOMINATIM_SEARCH_URL, [
                    ...$params,
                    'format' => 'json',
                    'limit' => 1,
                ]);

            if (! $response->successful()) {
                Log::warning('Site geocoding HTTP error', [
                    'params' => $params,
                    'status' => $response->status(),
                    'body' => mb_substr($response->body(), 0, 300),
                ]);

                return null;
            }

            $results = $response->json();
            if (! is_array($results) || $results === []) {
                return null;
            }

            $hit = $results[0];
            $latitude = isset($hit['lat']) ? (float) $hit['lat'] : null;
            $longitude = isset($hit['lon']) ? (float) $hit['lon'] : null;

            if ($latitude === null || $longitude === null) {
                return null;
            }

            return [
                'latitude' => $latitude,
                'longitude' => $longitude,
            ];
        } catch (\Throwable $exception) {
            Log::warning('Site geocoding failed', [
                'params' => $params,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }
    }

    private function userAgent(): string
    {
        $appName = config('app.name', 'CIVCO-BTP');
        $contact = config('services.nominatim.contact_email', 'contact@civco-btp.ma');

        return "{$appName}/1.0 ({$contact})";
    }

    private function verifySsl(): bool|string
    {
        $bundle = config('services.nominatim.ca_bundle');

        if (is_string($bundle) && $bundle !== '' && is_file($bundle)) {
            return $bundle;
        }

        return true;
    }
}
