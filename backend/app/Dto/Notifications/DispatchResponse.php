<?php

namespace App\Dto\Notifications;

final readonly class DispatchResponse
{
    /**
     * @param  list<int>  $notificationIds
     * @param  list<array{user_id: int, tenant_id: ?int, channel: string, status: string}>  $deliveries
     */
    public function __construct(
        public int $dispatched,
        public int $inApp,
        public int $email,
        public array $notificationIds = [],
        public array $deliveries = [],
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $ids = $data['notification_ids'] ?? [];
        $deliveries = $data['deliveries'] ?? [];

        return new self(
            dispatched: (int) ($data['dispatched'] ?? 0),
            inApp: (int) ($data['in_app'] ?? 0),
            email: (int) ($data['email'] ?? 0),
            notificationIds: is_array($ids) ? array_map('intval', $ids) : [],
            deliveries: is_array($deliveries) ? $deliveries : [],
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'dispatched' => $this->dispatched,
            'in_app' => $this->inApp,
            'email' => $this->email,
            'notification_ids' => $this->notificationIds,
            'deliveries' => $this->deliveries,
        ];
    }
}
