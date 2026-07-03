<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class MessagingPresenceService
{
    private const TTL_SECONDS = 45;

    private const STALE_SECONDS = 30;

    public function touch(User $user, ?int $projectId, ?int $clientUserId = null): void
    {
        Cache::put($this->cacheKey($user->id), [
            'project_id' => $projectId,
            'client_user_id' => $clientUserId,
            'updated_at' => now()->timestamp,
        ], self::TTL_SECONDS);
    }

    public function clear(User $user): void
    {
        Cache::forget($this->cacheKey($user->id));
    }

    public function isViewingThread(User $user, ?int $projectId, ?int $clientUserId = null): bool
    {
        $presence = Cache::get($this->cacheKey($user->id));

        if (! is_array($presence)) {
            return false;
        }

        $updatedAt = (int) ($presence['updated_at'] ?? 0);

        if ($updatedAt === 0 || now()->timestamp - $updatedAt > self::STALE_SECONDS) {
            return false;
        }

        $activeProjectId = array_key_exists('project_id', $presence) && $presence['project_id'] !== null
            ? (int) $presence['project_id']
            : null;
        $threadProjectId = $projectId !== null ? (int) $projectId : null;

        if ($activeProjectId !== $threadProjectId) {
            return false;
        }

        if ($user->isClientPortalUser()) {
            return true;
        }

        return (int) ($presence['client_user_id'] ?? 0) === (int) $clientUserId;
    }

    private function cacheKey(int $userId): string
    {
        return "messaging_presence:{$userId}";
    }
}
