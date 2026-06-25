<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class StoreProgressSnapshotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'comment' => ['nullable', 'string'],
            'recorded_at' => ['nullable', 'date'],
        ];
    }
}
