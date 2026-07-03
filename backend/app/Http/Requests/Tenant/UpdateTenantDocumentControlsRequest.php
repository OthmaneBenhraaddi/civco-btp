<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantDocumentControlsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && $user->tenant_id !== null
            && $user->isAdmin();
    }

    public function rules(): array
    {
        return [
            'max_official_devis' => ['required', 'integer', 'min:1', 'max:99'],
            'max_official_invoices' => ['required', 'integer', 'min:1', 'max:99'],
            'max_official_delivery_forms' => ['required', 'integer', 'min:1', 'max:99'],
            'max_official_contracts' => ['required', 'integer', 'min:1', 'max:99'],
        ];
    }
}
