<?php

namespace App\Http\Requests\Project;

use App\Enums\TaskStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = $this->attributes->get('company_id');

        return [
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:20'],
            'unit_price' => ['nullable', 'numeric'],
            'planned_start_date' => ['nullable', 'date'],
            'status' => ['sometimes', Rule::enum(TaskStatus::class)],
            'progress_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'assigned_to_user_id' => [
                'nullable',
                'integer',
                Rule::exists('company_user', 'user_id')->where('company_id', $companyId),
            ],
            'due_date' => ['nullable', 'date'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
