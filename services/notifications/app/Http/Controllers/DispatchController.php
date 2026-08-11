<?php

namespace App\Http\Controllers;

use App\Dispatching\NotificationDispatcher;
use App\Dto\DispatchRequest;
use App\Http\Requests\DispatchNotificationRequest;
use Illuminate\Http\JsonResponse;

class DispatchController extends Controller
{
    public function __construct(
        private readonly NotificationDispatcher $dispatcher,
    ) {}

    public function __invoke(DispatchNotificationRequest $request): JsonResponse
    {
        $payload = DispatchRequest::fromArray($request->validated());
        $result = $this->dispatcher->dispatch($payload);

        return response()->json($result->toArray());
    }
}
