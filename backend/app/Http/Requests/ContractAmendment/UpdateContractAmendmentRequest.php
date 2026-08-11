<?php

namespace App\Http\Requests\ContractAmendment;

use App\Enums\ContractAmendmentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContractAmendmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'string', Rule::in(ContractAmendmentType::values())],
            'amount_change' => ['nullable', 'numeric'],
            'duration_change_days' => ['nullable', 'integer'],
            'description' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],
        ];
    }
}
