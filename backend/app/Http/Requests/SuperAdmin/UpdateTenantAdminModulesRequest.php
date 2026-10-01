<?php

namespace App\Http\Requests\SuperAdmin;

use App\Support\AdminModules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantAdminModulesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'enabled_modules' => ['present', 'array'],
            'enabled_modules.*' => ['string', Rule::in(AdminModules::keys())],
        ];
    }
}
