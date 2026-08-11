<?php

namespace App\Http\Requests\Team;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateTeamMemberRoleRequest extends FormRequest
{
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
            'role_id' => ['required', 'integer', Rule::exists('roles', 'id')],
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
        return [
            'role_id.required' => 'Le rôle est requis.',
            'role_id.exists' => 'Le rôle sélectionné est invalide.',
        ];
    }
}
