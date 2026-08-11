<?php

namespace App\Dto\Notifications;

final readonly class DispatchRecipient
{
    public function __construct(
        public int $userId,
        public ?int $tenantId = null,
        public ?string $email = null,
        public ?string $name = null,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            userId: (int) ($data['user_id'] ?? 0),
            tenantId: isset($data['tenant_id']) ? (int) $data['tenant_id'] : null,
            email: isset($data['email']) ? (string) $data['email'] : null,
            name: isset($data['name']) ? (string) $data['name'] : null,
        );
    }

    /**
     * @return array{user_id: int, tenant_id: ?int, email: ?string, name: ?string}
     */
    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'tenant_id' => $this->tenantId,
            'email' => $this->email,
            'name' => $this->name,
        ];
    }
}
