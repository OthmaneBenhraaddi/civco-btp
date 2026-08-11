<?php

namespace App\Http\Requests\DocumentTemplate;

use App\Enums\DocumentTemplateType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && $user->isAdmin()
            && $user->tenant_id !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(DocumentTemplateType::values())],
            'body' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du template est requis.',
            'type.required' => 'Le type de template est requis.',
            'type.in' => 'Type de template invalide.',
            'body.required' => 'Le contenu du template est requis.',
        ];
    }
}
