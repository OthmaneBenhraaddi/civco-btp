<?php

namespace App\Http\Requests\ClientPortal;

use Illuminate\Foundation\Http\FormRequest;

class AcceptClientQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'signature_data' => [
                'required',
                'string',
                'regex:/^data:image\/(png|jpeg|jpg);base64,/',
                'max:500000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'signature_data.required' => 'La signature est requise.',
            'signature_data.regex' => 'Format de signature invalide.',
        ];
    }
}
