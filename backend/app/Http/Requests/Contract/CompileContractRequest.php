<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;

class CompileContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'contract_template_id' => ['required', 'integer', 'exists:contract_templates,id'],
            'project_id' => ['required', 'integer', 'exists:projects,id'],
        ];
    }
}
