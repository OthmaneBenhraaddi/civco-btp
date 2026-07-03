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
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $userId = $request->user()->id;
        $limit = $validated['limit'] ?? null;

        $unreadCount = Notification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->count();

        $query = Notification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->orderByDesc('created_at');

        if ($limit !== null) {
            $query->limit($limit);
        }

        $notifications = $query->get();

        return NotificationResource::collection($notifications)
            ->additional([
                'meta' => [
                    'unread_count' => $unreadCount,
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
                'unread_count' => $this->unreadCountFor($request->user()->id),
            ],
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'meta' => [
                'unread_count' => 0,
            ],
        ]);
    }

    private function unreadCountFor(int $userId): int
    {
        return Notification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }
}
