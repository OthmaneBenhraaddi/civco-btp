<?php

namespace App\Http\Requests\Team;

use App\Http\Requests\Concerns\ValidatesUserIdentity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTeamMemberRequest extends FormRequest
{
    use ValidatesUserIdentity;

    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && $user->isAdmin()
            && $user->tenant_id !== null;
    }

    public function rules(): array
    {
        return [
            ...$this->userIdentityRules(),
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'max:128'],
            'role' => ['required', Rule::in(['admin', 'technicien', 'comptable'])],
            'cin' => ['nullable', 'string', 'max:32'],
            'phone' => ['nullable', 'string', 'max:30'],
            'job_title' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return $this->userIdentityMessages();
    }
}
