<?php

namespace App\Dto\Notifications;

final readonly class DispatchRequest
{
    /**
     * @param  list<DispatchRecipient>  $recipients
     * @param  list<string>  $channels
     */
    public function __construct(
        public array $recipients,
        public string $title,
        public string $message,
        public string $type = 'project_alert',
        public ?string $actionPath = null,
        public array $channels = ['in_app'],
        public ?string $mailSubject = null,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $recipients = [];
        foreach ($data['recipients'] ?? [] as $recipient) {
            if (is_array($recipient)) {
                $recipients[] = DispatchRecipient::fromArray($recipient);
            }
        }

        $channels = $data['channels'] ?? ['in_app'];
        if (! is_array($channels)) {
            $channels = ['in_app'];
        }

        return new self(
            recipients: $recipients,
            title: (string) ($data['title'] ?? ''),
            message: (string) ($data['message'] ?? ''),
            type: (string) ($data['type'] ?? 'project_alert'),
            actionPath: isset($data['action_path']) ? (string) $data['action_path'] : null,
            channels: array_values(array_map('strval', $channels)),
            mailSubject: isset($data['mail_subject']) ? (string) $data['mail_subject'] : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'recipients' => array_map(fn (DispatchRecipient $r) => $r->toArray(), $this->recipients),
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'action_path' => $this->actionPath,
            'channels' => $this->channels,
            'mail_subject' => $this->mailSubject,
        ];
    }

    public function wantsInApp(): bool
    {
        return in_array('in_app', $this->channels, true);
    }

    public function wantsEmail(): bool
    {
        return in_array('email', $this->channels, true);
    }
}
