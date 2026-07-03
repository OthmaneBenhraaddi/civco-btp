<?php

namespace Tests\Unit;

use App\Services\SiteGeocodingService;
use App\Support\MoroccoCityCoordinates;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SiteGeocodingServiceTest extends TestCase
{
    public function test_it_falls_back_to_city_when_street_is_unknown(): void
    {
        Http::fake(function ($request) {
            $query = urldecode((string) $request->toPsrRequest()->getUri());

            if (str_contains($query, 'Boulevard+Pasteur') || str_contains($query, 'street=Boulevard')) {
                return Http::response([]);
            }

            return Http::response([
                [
                    'lat' => '33.6958383',
                    'lon' => '-7.3893292',
                    'display_name' => 'Mohammédia, Morocco',
                ],
            ]);
        });

        $result = app(SiteGeocodingService::class)->resolveFromParts(
            'Boulevard Pasteur',
            'Mohammedia',
            '28800',
        );

        $this->assertNotNull($result);
        $this->assertSame('Boulevard Pasteur, 28800 Mohammedia', $result['site_address']);
        $this->assertEqualsWithDelta(33.6958383, $result['latitude'], 0.0001);
        $this->assertEqualsWithDelta(-7.3893292, $result['longitude'], 0.0001);
    }

    public function test_it_uses_offline_city_coordinates_when_nominatim_is_unreachable(): void
    {
        Http::fake(fn () => throw new \RuntimeException('Connection refused'));

        $result = app(SiteGeocodingService::class)->resolveFromParts(
            'Boulevard Pasteur',
            'Mohammédia',
            '28800',
        );

        $this->assertNotNull($result);
        $this->assertEqualsWithDelta(33.6958383, $result['latitude'], 0.0001);
        $this->assertEqualsWithDelta(-7.3893292, $result['longitude'], 0.0001);
    }

    public function test_city_normalization_matches_accented_names(): void
    {
        $this->assertSame('mohammedia', MoroccoCityCoordinates::normalizeCityKey('Mohammédia'));
        $this->assertNotNull(MoroccoCityCoordinates::resolve('Mohammédia'));
    }

    public function test_it_returns_null_when_no_address_parts_are_provided(): void
    {
        Http::fake();

        $result = app(SiteGeocodingService::class)->resolveFromParts(null, null, null);

        $this->assertNull($result);
        Http::assertNothingSent();
    }
}
