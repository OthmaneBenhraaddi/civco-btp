<?php

namespace App\Http\Requests\SuperAdmin;

use App\Rules\SecureImageUpload;
use Illuminate\Foundation\Http\FormRequest;

class StoreHomepageMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png', 'max:4096', new SecureImageUpload],
        ];
    }
}
