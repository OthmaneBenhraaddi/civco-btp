<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

final class UserAvatarStorage
{
    public static function store(UploadedFile $file, int $userId): string
    {
        $filename = SecureUpload::uuidImageFilename($file, (string) $userId);

        return $file->storeAs('user-avatars', $filename, 'public');
    }

    public static function replace(UploadedFile $file, int $userId, ?string $previousPath = null): string
    {
        self::delete($previousPath);

        return self::store($file, $userId);
    }

    public static function delete(?string $avatarPath): void
    {
        if ($avatarPath === null || $avatarPath === '') {
            return;
        }

        Storage::disk('public')->delete($avatarPath);
    }

    public static function url(?string $avatarPath): ?string
    {
        if ($avatarPath === null || $avatarPath === '') {
            return null;
        }

        $normalized = ltrim(str_replace('\\', '/', $avatarPath), '/');

        return '/storage/'.$normalized;
    }
}
