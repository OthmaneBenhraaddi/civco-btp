<?php

namespace App\Http\Requests\DeliveryForm;

use App\Enums\DeliveryFormStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDeliveryFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['sometimes', 'integer', 'exists:clients,id'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'delivery_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::enum(DeliveryFormStatus::class)],
            'lines' => ['sometimes', 'array', 'min:1'],
            'lines.*.description' => ['required_with:lines', 'string', 'max:500'],
            'lines.*.quantity' => ['required_with:lines', 'numeric', 'min:0.001'],
            'lines.*.quote_line_id' => ['nullable', 'integer', 'exists:quote_lines,id'],
            'lines.*.project_phase_id' => ['nullable', 'integer', 'exists:project_phases,id'],
        ];
    }
}
