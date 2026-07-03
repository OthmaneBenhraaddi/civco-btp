<?php

namespace App\Http\Requests\ClientPortal;

use Illuminate\Foundation\Http\FormRequest;

class StorePortalMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'receiver_id' => ['required', 'integer', 'exists:users,id'],
            'message_text' => ['required', 'string', 'max:5000', 'regex:/\S/'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'receiver_id.required' => 'Le destinataire est requis.',
            'message_text.required' => 'Le message est requis.',
            'message_text.regex' => 'Le message ne peut pas être vide.',
        ];
    }
}
