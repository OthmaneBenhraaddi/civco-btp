<?php

namespace App\Http\Requests\Print;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TrackPrintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'document_type' => ['required', 'string', Rule::in(['invoice', 'quote', 'delivery_form', 'contract'])],
            'document_id' => ['required', 'integer', 'min:1'],
            'has_header' => ['sometimes', 'boolean'],
        ];
    }
}
