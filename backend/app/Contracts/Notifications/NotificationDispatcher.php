<?php

namespace App\Contracts\Notifications;

use App\Dto\Notifications\DispatchRequest;
use App\Dto\Notifications\DispatchResponse;

interface NotificationDispatcher
{
    public function dispatch(DispatchRequest $request): DispatchResponse;
}
