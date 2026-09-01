<?php

namespace App\Rules;

use App\Support\SecureUpload;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class SecureImageUpload implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            $fail('The uploaded file is invalid.');

            return;
        }

        $originalName = strtolower($value->getClientOriginalName());
        $extension = strtolower($value->getClientOriginalExtension());
        $mime = strtolower((string) ($value->getMimeType() ?? ''));

        if (str_contains($originalName, '..') || preg_match('/\.(php|phtml|js|html?|svg|xml)\./i', $originalName)) {
            $fail('This file name is not allowed for security reasons.');

            return;
        }

        if (! in_array($extension, SecureUpload::IMAGE_EXTENSIONS, true)) {
            $fail('Formats acceptés : PNG ou JPG.');

            return;
        }

        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png'];

        if (! in_array($mime, $allowedMimes, true)) {
            $fail('Le contenu du fichier ne correspond pas à une image PNG ou JPG.');

            return;
        }

        try {
            SecureUpload::safeImageExtension($value);
        } catch (\InvalidArgumentException) {
            $fail('Formats acceptés : PNG ou JPG.');
        }
    }
}
