<?php

namespace App\Http\Requests\Project;

use App\Enums\ProjectStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = $this->attributes->get('company_id');

        return [
            'client_id' => [
                'required',
                'integer',
                Rule::exists('clients', 'id')->where('company_id', $companyId),
            ],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'description_meta' => ['nullable', 'array'],
            'status' => ['sometimes', Rule::enum(ProjectStatus::class)],
            'nature' => ['nullable', 'string', 'max:100'],
            'sector' => ['nullable', Rule::in(['PRIVÉ', 'PUBLIC'])],
            'etat_paiement' => ['nullable', Rule::in(['PAYÉ', 'NON PAYÉ'])],
            'delais' => ['nullable', 'string', 'max:255'],
            'avancement' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'site_address_line1' => ['nullable', 'string', 'max:255'],
            'site_city' => ['nullable', 'string', 'max:100'],
            'site_postal_code' => ['nullable', 'string', 'max:20'],
            'lots' => ['nullable', 'array'],
            'lots.*' => ['string', 'max:255'],
            'lot_ids' => ['nullable', 'array'],
            'lot_ids.*' => ['integer', 'exists:lots,id'],
        ];
    }
}
