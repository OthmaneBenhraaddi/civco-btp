<?php

namespace App\Http\Requests\Quote;

use App\Enums\QuoteStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['sometimes', 'integer', 'exists:clients,id'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'status' => ['sometimes', Rule::enum(QuoteStatus::class)],
            'issued_at' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
