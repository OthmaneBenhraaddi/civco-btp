<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHomepageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'hero_title' => ['required', 'string', 'max:255'],
            'hero_highlight' => ['nullable', 'string', 'max:150'],
            'hero_description' => ['nullable', 'string', 'max:2000'],
            'cards' => ['nullable', 'array'],
            'cards.*.id' => ['required', 'integer', 'exists:homepage_cards,id'],
            'cards.*.title' => ['required', 'string', 'max:180'],
            'cards.*.description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
