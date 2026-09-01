<?php

namespace App\Http\Requests\SuperAdmin;

use App\Rules\SecureImageUpload;
use Illuminate\Foundation\Http\FormRequest;

class StoreHomepagePartnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'logo' => ['required', 'image', 'mimes:jpeg,jpg,png', 'max:2048', new SecureImageUpload],
        ];
    }
}
