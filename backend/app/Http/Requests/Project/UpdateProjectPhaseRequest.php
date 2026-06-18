<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectPhaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:150'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'planned_start_date' => ['nullable', 'date'],
            'planned_end_date' => ['nullable', 'date'],
            'progress_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
