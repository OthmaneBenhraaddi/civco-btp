<?php

namespace App\Http\Requests\ClientContact;

use App\Enums\ContactRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClientContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'contact_role' => ['sometimes', 'required', 'string', Rule::enum(ContactRole::class)],
        ];
    }
}
