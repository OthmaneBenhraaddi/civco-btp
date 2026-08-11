<?php

namespace App\Dispatching;

use App\Dto\DispatchRequest;
use App\Dto\DispatchResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

final class NotificationDispatcher
{
    public function dispatch(DispatchRequest $request): DispatchResponse
    {
        $deliveries = [];
        $inApp = 0;
        $email = 0;

        foreach ($request->recipients as $recipient) {
            if ($recipient->userId <= 0) {
                continue;
            }

            if ($request->wantsInApp()) {
                $inApp++;
                $deliveries[] = [
                    'user_id' => $recipient->userId,
                    'tenant_id' => $recipient->tenantId,
                    'channel' => 'in_app',
                    'status' => 'queued',
                ];
            }

            if ($request->wantsEmail() && filled($recipient->email)) {
                $sent = $this->sendEmail($request, $recipient->email, $recipient->name);
                if ($sent) {
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
            deliveries: $deliveries,
        );
    }

    private function sendEmail(DispatchRequest $request, string $email, ?string $name): bool
    {
        $subject = $request->mailSubject ?: $request->title;
        $body = $request->message;

        try {
            Mail::raw($body, function ($message) use ($email, $name, $subject): void {
                $message->to($email, $name)->subject($subject);
            });

            return true;
        } catch (Throwable $exception) {
            Log::warning('Notification email failed.', [
                'email' => $email,
                'error' => $exception->getMessage(),
            ]);

            return false;
        }
    }
}
