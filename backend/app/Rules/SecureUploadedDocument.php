<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class SecureUploadedDocument implements ValidationRule
{
    /** @var array<string, list<string>> */
    public const ALLOWED_EXTENSIONS = [
        'pdf' => ['application/pdf'],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
        'doc' => ['application/msword'],
        'docx' => [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip',
        ],
        'xls' => ['application/vnd.ms-excel'],
        'xlsx' => [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip',
        ],
    ];

    /** @var list<string> */
    public const BLOCKED_EXTENSIONS = [
        'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'ps1', 'sh', 'bash', 'php', 'phtml',
        'js', 'jsx', 'ts', 'tsx', 'html', 'htm', 'svg', 'xml', 'jar', 'vbs', 'dll',
        'app', 'deb', 'rpm', 'cgi', 'pl', 'py', 'rb', 'asp', 'aspx', 'jsp',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            $fail('The uploaded file is invalid.');

            return;
        }

        $originalName = strtolower($value->getClientOriginalName());
        $extension = strtolower($value->getClientOriginalExtension());
        $detectedMime = strtolower($value->getMimeType() ?? '');

        if (str_contains($originalName, '..') || preg_match('/\.(exe|bat|cmd|sh|php|js|html?)\./i', $originalName)) {
            $fail('This file name is not allowed for security reasons.');

            return;
        }

        if ($extension === '' || in_array($extension, self::BLOCKED_EXTENSIONS, true)) {
            $fail('Executable and script files are not allowed.');

            return;
        }

        if (! array_key_exists($extension, self::ALLOWED_EXTENSIONS)) {
            $fail('Only PDF, JPEG, PNG, DOC, DOCX, XLS, and XLSX files are allowed.');

            return;
        }

        $allowedMimes = self::ALLOWED_EXTENSIONS[$extension];

        if (! in_array($detectedMime, $allowedMimes, true)) {
            $fail('The file content does not match its extension.');

            return;
        }
    }
}
