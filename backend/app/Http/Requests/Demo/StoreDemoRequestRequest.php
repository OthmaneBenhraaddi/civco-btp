<?php

namespace App\Http\Requests\Demo;

use Illuminate\Foundation\Http\FormRequest;

class StoreDemoRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:150'],
            'company_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:191'],
            'phone' => ['nullable', 'string', 'max:40'],
            'message' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
