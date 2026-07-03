<?php

namespace App\Http\Requests\Concerns;

use App\Models\User;

trait ValidatesUserIdentity
{
    /**
     * @return array<string, list<string>>
     */
    protected function userIdentityMessages(): array
    {
        return [
            'first_name.required' => 'Le prénom est requis.',
            'first_name.regex' => 'Le prénom ne peut pas être vide.',
            'first_name.max' => 'Le prénom ne peut pas dépasser 100 caractères.',
            'last_name.required' => 'Le nom est requis.',
            'last_name.regex' => 'Le nom ne peut pas être vide.',
            'last_name.max' => 'Le nom ne peut pas dépasser 100 caractères.',
        ];
    }

    /**
     * @return array<string, list<mixed>>
     */
    protected function userIdentityRules(): array
    {
        return User::identityFieldRules();
    }
}
