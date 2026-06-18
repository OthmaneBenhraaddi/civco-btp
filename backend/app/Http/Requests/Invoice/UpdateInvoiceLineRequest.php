<?php

namespace App\Http\Requests\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceLineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'string', 'max:500'],
            'quantity' => ['sometimes', 'numeric', 'min:0.001'],
            'unit_price_ht' => ['sometimes', 'numeric', 'min:0'],
            'tax_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
