<?php

namespace App\Http\Requests\ContractAmendment;

use App\Enums\ContractAmendmentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContractAmendmentStatusRequest extends FormRequest
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
            'status' => ['required', 'string', Rule::in(ContractAmendmentStatus::values())],
        ];
    }
}
