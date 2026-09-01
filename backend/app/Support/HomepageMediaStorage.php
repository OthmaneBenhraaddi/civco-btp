<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

final class HomepageMediaStorage
{
    public static function store(UploadedFile $file, string $folder): string
    {
        $filename = SecureUpload::uuidImageFilename($file);

        return $file->storeAs($folder, $filename, 'public');
    }

    public static function replace(UploadedFile $file, string $folder, ?string $previousPath = null): string
    {
        self::delete($previousPath);

        return self::store($file, $folder);
    }

    public static function delete(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        Storage::disk('public')->delete($path);
    }

    public static function url(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        $normalized = ltrim(str_replace('\\', '/', $path), '/');

        return '/storage/'.$normalized;
    }
}
