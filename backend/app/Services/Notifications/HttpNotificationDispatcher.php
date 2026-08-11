<?php

namespace App\Services\Notifications;

use App\Contracts\Notifications\NotificationDispatcher;
use App\Dto\Notifications\DispatchRequest;
use App\Dto\Notifications\DispatchResponse;
use App\Models\Notification;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

final class HttpNotificationDispatcher implements NotificationDispatcher
{
    public function __construct(
        private readonly LocalNotificationDispatcher $localFallback,
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly int $timeout = 10,
    ) {}

    public function dispatch(DispatchRequest $request): DispatchResponse
    {
        try {
            $response = Http::timeout($this->timeout)
                ->acceptJson()
                ->asJson()
                ->withToken($this->token)
                ->withHeaders([
                    'X-Internal-Token' => $this->token,
                ])
                ->post($this->baseUrl.'/internal/v1/dispatch', $request->toArray());

            if ($response->failed()) {
                Log::warning('Notification dispatcher returned an HTTP error, falling back to local.', [
                    'status' => $response->status(),
                    'url' => $this->baseUrl,
                ]);

                return $this->localFallback->dispatch($request);
            }

            $remote = DispatchResponse::fromArray($response->json() ?? []);

            // Sanctum read API stays on the monolith: persist in-app rows after remote ack.
            $notificationIds = $this->persistInAppAfterRemoteAck($request);

            return new DispatchResponse(
                dispatched: count($notificationIds) + $remote->email,
                inApp: count($notificationIds),
                email: $remote->email,
                notificationIds: $notificationIds,
                deliveries: $remote->deliveries,
            );
        } catch (ConnectionException|Throwable $exception) {
            Log::warning('Notification dispatcher unreachable, falling back to local.', [
                'url' => $this->baseUrl,
                'error' => $exception->getMessage(),
            ]);

            return $this->localFallback->dispatch($request);
        }
    }

    /**
     * @return list<int>
     */
    private function persistInAppAfterRemoteAck(DispatchRequest $request): array
    {
        if (! $request->wantsInApp()) {
            return [];
        }

        $ids = [];

        foreach ($request->recipients as $recipient) {
            if ($recipient->userId <= 0) {
                continue;
            }

            $notification = Notification::query()->create([
                'user_id' => $recipient->userId,
                'tenant_id' => $recipient->tenantId,
                'title' => $request->title,
                'message' => $request->message,
                'type' => $request->type,
                'action_path' => $request->actionPath,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $ids[] = $notification->id;
        }

        return $ids;
    }
}
