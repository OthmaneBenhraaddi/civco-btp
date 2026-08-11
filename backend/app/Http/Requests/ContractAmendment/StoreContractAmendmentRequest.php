<?php

namespace App\Http\Requests\ContractAmendment;

use App\Enums\ContractAmendmentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContractAmendmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(ContractAmendmentType::values())],
            'contract_id' => ['nullable', 'integer', 'exists:contracts,id'],
            'amount_change' => ['nullable', 'numeric'],
            'duration_change_days' => ['nullable', 'integer'],
            'description' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $amount = (float) $this->input('amount_change', 0);
            $days = (int) $this->input('duration_change_days', 0);
            $description = trim((string) $this->input('description', ''));

            if (abs($amount) < 0.00001 && $days === 0 && $description === '') {
                $validator->errors()->add(
                    'amount_change',
                    'Indiquez un impact budgétaire, un nombre de jours, ou une description de périmètre.',
                );
            }
        });
    }
}
