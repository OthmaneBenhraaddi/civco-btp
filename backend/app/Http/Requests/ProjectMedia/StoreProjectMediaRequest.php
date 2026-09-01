<?php

namespace App\Http\Requests\ProjectMedia;

use App\Rules\SecureImageUpload;
use Illuminate\Foundation\Http\FormRequest;

class StoreProjectMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png', 'max:10240', new SecureImageUpload],
        ];
    }
}
