<?php

namespace App\Http\Requests\DeliveryForm;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeliveryFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'quote_id' => ['nullable', 'integer', 'exists:quotes,id'],
            'delivery_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.description' => ['required', 'string', 'max:500'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.001'],
            'lines.*.quote_line_id' => ['nullable', 'integer', 'exists:quote_lines,id'],
            'lines.*.project_phase_id' => ['nullable', 'integer', 'exists:project_phases,id'],
        ];
    }
}
