<?php

namespace App\Services\Notifications;

use App\Contracts\Notifications\NotificationDispatcher;
use App\Dto\Notifications\DispatchRequest;
use App\Dto\Notifications\DispatchResponse;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

final class LocalNotificationDispatcher implements NotificationDispatcher
{
    public function dispatch(DispatchRequest $request): DispatchResponse
    {
        $notificationIds = [];
        $deliveries = [];
        $inApp = 0;
        $email = 0;

        foreach ($request->recipients as $recipient) {
            if ($recipient->userId <= 0) {
                continue;
            }

            if ($request->wantsInApp()) {
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

                $notificationIds[] = $notification->id;
                $inApp++;
                $deliveries[] = [
                    'user_id' => $recipient->userId,
                    'tenant_id' => $recipient->tenantId,
                    'channel' => 'in_app',
                    'status' => 'stored',
                ];
            }

            if ($request->wantsEmail() && filled($recipient->email)) {
                if ($this->sendEmail($request, $recipient->email, $recipient->name)) {
                    $email++;
                    $deliveries[] = [
                        'user_id' => $recipient->userId,
                        'tenant_id' => $recipient->tenantId,
                        'channel' => 'email',
                        'status' => 'sent',
                    ];
                } else {
                    $deliveries[] = [
                        'user_id' => $recipient->userId,
                        'tenant_id' => $recipient->tenantId,
                        'channel' => 'email',
                        'status' => 'failed',
                    ];
                }
            }
        }

        return new DispatchResponse(
            dispatched: $inApp + $email,
            inApp: $inApp,
            email: $email,
            notificationIds: $notificationIds,
            deliveries: $deliveries,
        );
    }

    private function sendEmail(DispatchRequest $request, string $email, ?string $name): bool
    {
        try {
            Mail::raw($request->message, function ($message) use ($request, $email, $name): void {
                $message
                    ->to($email, $name)
                    ->subject($request->mailSubject ?: $request->title);
            });

            return true;
        } catch (Throwable $exception) {
            Log::warning('Local notification email failed.', [
                'email' => $email,
                'error' => $exception->getMessage(),
            ]);

            return false;
        }
    }
}
