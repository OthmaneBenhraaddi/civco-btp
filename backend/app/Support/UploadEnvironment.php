<?php

namespace App\Support;

class UploadEnvironment
{
    public static function tmpDir(): string
    {
        $tmpDir = storage_path('framework/uploads-tmp');

        if (! is_dir($tmpDir)) {
            mkdir($tmpDir, 0755, true);
        }

        return str_replace('\\', '/', $tmpDir);
    }

    /** @return list<string> */
    public static function phpFlags(): array
    {
        return [
            '-d', 'upload_tmp_dir='.self::tmpDir(),
            '-d', 'upload_max_filesize=12M',
            '-d', 'post_max_size=14M',
            '-d', 'display_errors=0',
        ];
    }
}
