<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

final class TenantLogoStorage
{
    public static function store(UploadedFile $file, string $subdomain): string
    {
        $filename = SecureUpload::uuidImageFilename($file, $subdomain);

        return $file->storeAs('tenant-logos', $filename, 'public');
    }

    public static function replace(UploadedFile $file, string $subdomain, ?string $previousPath = null): string
    {
        self::delete($previousPath);

        return self::store($file, $subdomain);
    }

    public static function delete(?string $logoPath): void
    {
        if ($logoPath === null || $logoPath === '') {
            return;
        }

        Storage::disk('public')->delete($logoPath);
    }

    public static function url(?string $logoPath): ?string
    {
        if ($logoPath === null || $logoPath === '') {
            return null;
        }

        $normalized = ltrim(str_replace('\\', '/', $logoPath), '/');

        return '/storage/'.$normalized;
    }
}
