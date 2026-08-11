<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class ImportProjectExcelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:10240',
                'extensions:xlsx',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Sélectionnez un fichier Excel .xlsx.',
            'file.mimes' => 'Le fichier doit être au format Excel (.xlsx).',
            'file.extensions' => 'Le fichier doit être au format Excel (.xlsx).',
            'file.max' => 'Le fichier ne peut pas dépasser 10 Mo.',
        ];
    }
}
