<?php

namespace App\Http\Requests\DispatchNote;

use Illuminate\Foundation\Http\FormRequest;

class StoreDispatchNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'delivery_form_ids' => ['required', 'array', 'min:1'],
            'delivery_form_ids.*' => ['integer', 'exists:delivery_forms,id'],
        ];
    }
}
