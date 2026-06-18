<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = $this->attributes->get('company_id');

        return [
            'user_id' => [
                'required',
                'integer',
                Rule::exists('company_user', 'user_id')->where('company_id', $companyId),
            ],
            'role_label' => ['nullable', 'string', 'max:50'],
        ];
    }
}
