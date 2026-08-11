<?php

namespace App\Http\Requests\SuperAdmin\Concerns;

use Illuminate\Validation\Rule;

trait ValidatesTenantBrandingFields
{
    /**
     * @return array<string, list<mixed>>
     */
    protected function brandingRules(?int $ignoreTenantId = null): array
    {
        $domainUnique = Rule::unique('tenants', 'custom_domain');

        if ($ignoreTenantId !== null) {
            $domainUnique = $domainUnique->ignore($ignoreTenantId);
        }

        return [
            'custom_domain' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i',
                $domainUnique,
            ],
            'mail_from_address' => ['nullable', 'email', 'max:150'],
            'mail_host' => ['nullable', 'string', 'max:255'],
            'mail_port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'mail_username' => ['nullable', 'string', 'max:150'],
            'mail_password' => ['nullable', 'string', 'max:500'],
            'mail_encryption' => ['nullable', 'string', Rule::in(['tls', 'ssl', 'none', ''])],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function brandingPayload(): array
    {
        $payload = [
            'custom_domain' => $this->filled('custom_domain')
                ? strtolower(trim($this->string('custom_domain')->toString()))
                : null,
            'mail_from_address' => $this->filled('mail_from_address')
                ? strtolower(trim($this->string('mail_from_address')->toString()))
                : null,
            'mail_host' => $this->filled('mail_host')
                ? trim($this->string('mail_host')->toString())
                : null,
            'mail_port' => $this->filled('mail_port')
                ? $this->integer('mail_port')
                : null,
            'mail_username' => $this->filled('mail_username')
                ? trim($this->string('mail_username')->toString())
                : null,
            'mail_encryption' => $this->filled('mail_encryption')
                ? ($this->string('mail_encryption')->toString() === 'none'
                    ? null
                    : strtolower($this->string('mail_encryption')->toString()))
                : null,
        ];

        // Empty password on update means "keep existing".
        if ($this->filled('mail_password')) {
            $payload['mail_password'] = $this->string('mail_password')->toString();
        }

        return $payload;
    }
}
