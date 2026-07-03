<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\MessagingPresenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessagingPresenceController extends Controller
{
    public function __construct(
        private readonly MessagingPresenceService $messagingPresenceService,
    ) {}

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'active' => ['sometimes', 'boolean'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'client_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $user = $request->user();

        if (($validated['active'] ?? true) === false) {
            $this->messagingPresenceService->clear($user);

            return response()->json(['status' => 'cleared']);
        }

        $this->messagingPresenceService->touch(
            $user,
            $validated['project_id'] ?? null,
            $validated['client_user_id'] ?? null,
        );

        return response()->json(['status' => 'ok']);
    }
}
