<?php

namespace App\Http\Requests\Document;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreDocumentRequest extends FormRequest
{
    private const ALLOWED_MIMES = [
        'pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'xls', 'xlsx',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:10240'],
            'category' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $file = $this->file('file');

            if ($file === null || ! $file->isValid()) {
                $error = $file?->getErrorMessage() ?? 'The file failed to upload.';

                $validator->errors()->add('file', $error);

                return;
            }

            $extension = strtolower($file->getClientOriginalExtension());

            if (! in_array($extension, self::ALLOWED_MIMES, true)) {
                $validator->errors()->add('file', 'Unsupported file type.');
            }
        });
    }
}
