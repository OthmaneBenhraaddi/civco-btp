<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;

class SubmitContractSignatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'signature_data' => [
                'required',
                'string',
                'regex:/^data:image\/(png|jpeg|jpg);base64,/',
                'max:500000',
            ],
        ];
    }
}
