<?php

namespace App\Http\Requests\SuperAdmin;

use App\Enums\TenantStatus;
use App\Http\Requests\SuperAdmin\Concerns\ValidatesTenantBrandingFields;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantRequest extends FormRequest
{
    use ValidatesTenantBrandingFields;

    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        $tenant = $this->route('tenant');

        return [
            'name' => ['required', 'string', 'max:150'],
            'subdomain' => [
                'required',
                'string',
                'max:63',
                'regex:/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/',
                Rule::unique('tenants', 'subdomain')->ignore($tenant?->id),
                Rule::notIn(config('tenancy.ignored_subdomains', [])),
            ],
            'status' => ['required', Rule::enum(TenantStatus::class)],
            ...$this->brandingRules($tenant?->id),
        ];
    }
}
