<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DispatchNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'recipients' => ['required', 'array', 'min:1'],
            'recipients.*.user_id' => ['required', 'integer', 'min:1'],
            'recipients.*.tenant_id' => ['nullable', 'integer', 'min:1'],
            'recipients.*.email' => ['nullable', 'email', 'max:255'],
            'recipients.*.name' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'type' => ['nullable', 'string', 'max:50'],
            'action_path' => ['nullable', 'string', 'max:500'],
            'channels' => ['nullable', 'array'],
            'channels.*' => ['string', 'in:in_app,email'],
            'mail_subject' => ['nullable', 'string', 'max:255'],
        ];
    }
}
