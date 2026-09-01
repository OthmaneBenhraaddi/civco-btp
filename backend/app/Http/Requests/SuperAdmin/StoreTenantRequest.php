<?php

namespace App\Http\Requests\SuperAdmin;

use App\Enums\TenantStatus;
use App\Http\Requests\SuperAdmin\Concerns\ValidatesTenantBrandingFields;
use App\Rules\SecureImageUpload;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTenantRequest extends FormRequest
{
    use ValidatesTenantBrandingFields;

    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'subdomain' => [
                'required',
                'string',
                'max:63',
                'regex:/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/',
                Rule::unique('tenants', 'subdomain'),
                Rule::notIn(config('tenancy.ignored_subdomains', [])),
            ],
            'status' => ['required', Rule::enum(TenantStatus::class)],
            'logo' => ['nullable', 'image', 'mimes:jpeg,jpg,png', 'max:2048', new SecureImageUpload],
            ...$this->brandingRules(),
        ];
    }
}
