<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RenderDocumentRequest extends FormRequest
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
            'template_html' => ['required', 'string'],
            'variables' => ['sometimes', 'array'],
            'options' => ['sometimes', 'array'],
            'options.header' => ['sometimes', 'boolean'],
            'options.header_html' => ['sometimes', 'nullable', 'string'],
            'options.watermark' => ['sometimes', 'nullable', 'string', 'max:255'],
            'options.locale' => ['sometimes', 'nullable', 'string', 'max:16'],
            'options.signature_html' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
