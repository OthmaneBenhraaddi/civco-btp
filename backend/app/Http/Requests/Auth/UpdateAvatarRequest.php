<?php

namespace App\Http\Requests\Auth;

use App\Rules\SecureImageUpload;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAvatarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'avatar' => ['required', 'image', 'mimes:jpeg,jpg,png', 'max:2048', new SecureImageUpload],
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.required' => 'L\'avatar est requis.',
            'avatar.image' => 'Le fichier doit être une image.',
            'avatar.mimes' => 'Formats acceptés : PNG ou JPG.',
            'avatar.max' => 'L\'avatar ne doit pas dépasser 2 Mo.',
        ];
    }
}
