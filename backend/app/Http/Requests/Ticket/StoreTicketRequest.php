<?php

namespace App\Http\Requests\Ticket;

use App\Enums\TicketPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isPortal = $this->user()?->isClientPortalUser() ?? false;

        $rules = [
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:120'],
            'priority' => ['required', Rule::enum(TicketPriority::class)],
            'body' => ['required', 'string', 'max:10000'],
        ];

        if ($isPortal) {
            $rules['project_id'] = ['required', 'integer', 'exists:projects,id'];

            return $rules;
        }

        $rules['client_id'] = ['required', 'integer', 'exists:clients,id'];
        $rules['project_id'] = ['nullable', 'integer', 'exists:projects,id'];

        return $rules;
    }
}
