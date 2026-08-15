<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TicketMessage */
class TicketMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_id' => $this->ticket_id,
            'body' => $this->body,
            'created_at' => $this->created_at?->toIso8601String(),
            'sender' => $this->whenLoaded('sender', function () {
                $displayName = $this->sender->full_name ?? 'Utilisateur';
                $initials = collect(preg_split('/\s+/', trim($displayName)) ?: [])
                    ->filter()
                    ->map(fn (string $part) => mb_substr($part, 0, 1))
                    ->take(2)
                    ->implode('');

                return [
                    'id' => $this->sender->id,
                    'full_name' => $displayName,
                    'is_client' => $this->sender->client_id !== null,
                    'job_title' => $this->sender->job_title,
                    'initials' => mb_strtoupper($initials !== '' ? $initials : 'U'),
                ];
            }),
        ];
    }
}
