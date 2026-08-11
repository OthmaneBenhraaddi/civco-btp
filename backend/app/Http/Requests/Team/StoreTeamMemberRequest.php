<?php

namespace App\Http\Requests\Team;

use App\Http\Requests\Concerns\ValidatesUserIdentity;
use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'role_id' => ['required', 'integer', Rule::exists('roles', 'id')],
            'cin' => ['nullable', 'string', 'max:32'],
            'phone' => ['nullable', 'string', 'max:30'],
            'job_title' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $roleId = $this->integer('role_id');
            $companyId = $this->user()?->primaryCompany()?->id;
            $role = Role::query()->find($roleId);

            if ($role === null) {
                return;
            }

            if (in_array($role->slug, ['super_admin', 'client_extern'], true)) {
                $validator->errors()->add('role_id', 'Ce rôle ne peut pas être assigné à un membre d\'équipe.');
            }

            if ($role->company_id !== null && $role->company_id !== $companyId) {
                $validator->errors()->add('role_id', 'Ce rôle n\'appartient pas à votre société.');
            }
        });
    }

    public function messages(): array
    {
        return $this->userIdentityMessages();
    }
}
