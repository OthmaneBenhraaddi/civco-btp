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
            'max_official_devis_with_header' => ['required', 'integer', 'min:1', 'max:99'],
            'max_official_devis_without_header' => ['required', 'integer', 'min:1', 'max:99'],
            'max_official_invoices_with_header' => ['required', 'integer', 'min:1', 'max:99'],
            'max_official_invoices_without_header' => ['required', 'integer', 'min:1', 'max:99'],
            'max_official_delivery_forms_with_header' => ['required', 'integer', 'min:1', 'max:99'],
            'max_official_delivery_forms_without_header' => ['required', 'integer', 'min:1', 'max:99'],
            'max_official_contracts_with_header' => ['required', 'integer', 'min:1', 'max:99'],
            'max_official_contracts_without_header' => ['required', 'integer', 'min:1', 'max:99'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Keep legacy single fields in sync for older readers.
        $this->merge([
            'max_official_devis' => max(
                (int) $this->input('max_official_devis_with_header', 1),
                (int) $this->input('max_official_devis_without_header', 1),
            ),
            'max_official_invoices' => max(
                (int) $this->input('max_official_invoices_with_header', 1),
                (int) $this->input('max_official_invoices_without_header', 1),
            ),
            'max_official_delivery_forms' => max(
                (int) $this->input('max_official_delivery_forms_with_header', 1),
                (int) $this->input('max_official_delivery_forms_without_header', 1),
            ),
            'max_official_contracts' => max(
                (int) $this->input('max_official_contracts_with_header', 1),
                (int) $this->input('max_official_contracts_without_header', 1),
            ),
        ]);
    }

    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);

        if ($key !== null) {
            return $validated;
        }

        return [
            ...$validated,
            'max_official_devis' => max(
                (int) $validated['max_official_devis_with_header'],
                (int) $validated['max_official_devis_without_header'],
            ),
            'max_official_invoices' => max(
                (int) $validated['max_official_invoices_with_header'],
                (int) $validated['max_official_invoices_without_header'],
            ),
            'max_official_delivery_forms' => max(
                (int) $validated['max_official_delivery_forms_with_header'],
                (int) $validated['max_official_delivery_forms_without_header'],
            ),
            'max_official_contracts' => max(
                (int) $validated['max_official_contracts_with_header'],
                (int) $validated['max_official_contracts_without_header'],
            ),
        ];
    }
}
