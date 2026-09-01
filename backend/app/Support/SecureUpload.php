<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Shared helpers for raster image uploads (JPG/PNG only) with safe stored names.
 */
final class SecureUpload
{
    /** @var list<string> */
    public const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];

    /** @var array<string, string> */
    private const MIME_TO_EXTENSION = [
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg',
        'image/pjpeg' => 'jpg',
        'image/png' => 'png',
    ];

    public static function safeImageExtension(UploadedFile $file): string
    {
        $mime = strtolower((string) ($file->getMimeType() ?: ''));

        if (isset(self::MIME_TO_EXTENSION[$mime])) {
            return self::MIME_TO_EXTENSION[$mime];
        }

        $clientExt = strtolower($file->getClientOriginalExtension() ?: '');
        $guessed = strtolower($file->extension() ?: '');

        foreach ([$guessed, $clientExt] as $ext) {
            if (in_array($ext, self::IMAGE_EXTENSIONS, true)) {
                return $ext === 'jpeg' ? 'jpg' : $ext;
            }
        }

        throw new InvalidArgumentException('Only PNG and JPG images are allowed.');
    }

    public static function uuidImageFilename(UploadedFile $file, string $prefix = ''): string
    {
        $extension = self::safeImageExtension($file);
        $safePrefix = $prefix !== '' ? Str::slug($prefix).'-' : '';

        return $safePrefix.Str::uuid()->toString().'.'.$extension;
    }

    /**
     * Strip path segments and dangerous characters from an original download name.
     */
    public static function sanitizeOriginalFilename(string $originalName, string $fallback = 'file'): string
    {
        $basename = basename(str_replace(["\0", '\\'], ['', '/'], $originalName));
        $basename = preg_replace('/[^\w.\- ()\[\]]+/u', '_', $basename) ?? $fallback;
        $basename = trim($basename, '._ ');

        if ($basename === '' || $basename === '.' || $basename === '..') {
            return $fallback;
        }

        return Str::limit($basename, 180, '');
    }

    public static function uuidPrefixedFilename(UploadedFile $file, string $fallbackExt = 'bin'): string
    {
        $safeOriginal = self::sanitizeOriginalFilename($file->getClientOriginalName(), 'upload');
        $extension = strtolower(pathinfo($safeOriginal, PATHINFO_EXTENSION) ?: ($file->extension() ?: $fallbackExt));
        $extension = preg_replace('/[^a-z0-9]+/', '', $extension) ?: $fallbackExt;

        return Str::uuid()->toString().'.'.$extension;
    }
}
