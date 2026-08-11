<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTenantAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100', 'regex:/\S/'],
            'last_name' => ['required', 'string', 'max:100', 'regex:/\S/'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
        ];
    }
}
