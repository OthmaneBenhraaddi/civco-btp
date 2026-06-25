<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SiteGeocodingService
{
    /**
     * @return array{site_address: string, latitude: float, longitude: float}|null
     */
    public function resolveFromParts(?string $line1, ?string $city, ?string $postalCode): ?array
    {
        $local = trim(implode(', ', array_filter([
            $line1,
            trim(implode(' ', array_filter([$postalCode, $city]))),
        ])));

        if ($local === '') {
            return null;
        }

        $query = $local.', Morocco';

        try {
            $response = Http::timeout(8)
                ->withHeaders([
                    'User-Agent' => config('app.name', 'CIVCO-BTP').'/1.0',
                ])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $query,
                    'format' => 'json',
                    'limit' => 1,
                ]);

            if (! $response->successful()) {
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
                'site_address' => $local,
                'latitude' => $latitude,
                'longitude' => $longitude,
            ];
        } catch (\Throwable $exception) {
            Log::warning('Site geocoding failed', [
                'query' => $query,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }
    }
}
