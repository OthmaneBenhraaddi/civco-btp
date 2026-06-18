<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NotificationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $userId = $request->user()->id;

        $notifications = Notification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->orderByDesc('created_at')
            ->get();

        return NotificationResource::collection($notifications)
            ->additional([
                'meta' => [
                    'unread_count' => $notifications->count(),
                ],
            ]);
    }

    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(404);
        }

        $notification->markAsRead();

        return response()->json([
            'data' => new NotificationResource($notification->fresh()),
            'meta' => [
                'unread_count' => Notification::query()
                    ->where('user_id', $request->user()->id)
                    ->whereNull('read_at')
                    ->count(),
            ],
        ]);
    }
}
