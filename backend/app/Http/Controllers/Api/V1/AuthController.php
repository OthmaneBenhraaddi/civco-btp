<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Middleware\CheckUserStatus;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\UpdateAvatarRequest;
use App\Services\ActivityLogService;
use App\Services\AuthContextService;
use App\Support\TenantAuthGuard;
use App\Support\UserAvatarStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request, AuthContextService $authContext): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $user = Auth::user();

        if (! $user->canAccessApplication()) {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => [CheckUserStatus::DEACTIVATED_MESSAGE],
            ]);
        }

        TenantAuthGuard::assertLoginMatchesTenant($request, $user);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json($authContext->forUser($user));
    }

    public function me(Request $request, AuthContextService $authContext): JsonResponse
    {
        $companyId = $request->filled('company_id')
            ? $request->integer('company_id')
            : null;

        return response()->json(
            $authContext->forUser($request->user(), $companyId)
        );
    }

    public function updateProfile(Request $request, AuthContextService $authContext): JsonResponse
    {
        $user = $request->user();
        $previousEmail = $user?->email;

        $validated = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:120'],
            'stealth_shortcut' => ['sometimes', 'nullable', 'array'],
            'stealth_shortcut.ctrl' => ['required_with:stealth_shortcut', 'boolean'],
            'stealth_shortcut.shift' => ['required_with:stealth_shortcut', 'boolean'],
            'stealth_shortcut.alt' => ['required_with:stealth_shortcut', 'boolean'],
            'stealth_shortcut.meta' => ['required_with:stealth_shortcut', 'boolean'],
            'stealth_shortcut.key' => ['required_with:stealth_shortcut', 'string', 'max:32'],
        ]);

        $updates = [];

        foreach (['first_name', 'last_name', 'email', 'phone', 'job_title'] as $field) {
            if (array_key_exists($field, $validated)) {
                $value = $validated[$field];
                $updates[$field] = is_string($value) ? trim($value) : $value;
                if (in_array($field, ['first_name', 'last_name'], true) && ($updates[$field] ?? '') === '') {
                    $updates[$field] = $user->{$field};
                }
                if ($field === 'job_title' && ($updates[$field] ?? null) === '') {
                    $updates[$field] = null;
                }
                if ($field === 'phone' && ($updates[$field] ?? null) === '') {
                    $updates[$field] = null;
                }
            }
        }

        if (array_key_exists('stealth_shortcut', $validated)) {
            $updates['stealth_shortcut'] = $this->normalizeStealthShortcut($validated['stealth_shortcut']);
        }

        if ($updates !== []) {
            $user->update($updates);
        }

        $emailChanged = array_key_exists('email', $validated) && $previousEmail !== $validated['email'];

        if ($emailChanged) {
            $freshUser = $user->fresh()->loadMissing(['companies', 'roles']);
            $roleLabel = $freshUser->roles->first()?->name ?? $freshUser->job_title ?? 'Membre';
            app(ActivityLogService::class)->logCredentialsUpdated(
                $freshUser,
                $roleLabel,
                $freshUser->email,
                true,
                false,
                $freshUser,
            );
        }

        $companyId = $request->filled('company_id')
            ? $request->integer('company_id')
            : null;

        return response()->json(
            $authContext->forUser($user->fresh(), $companyId)
        );
    }

    public function updateAvatar(UpdateAvatarRequest $request, AuthContextService $authContext): JsonResponse
    {
        $user = $request->user();

        $avatarPath = UserAvatarStorage::replace(
            $request->file('avatar'),
            (int) $user->id,
            $user->avatar_path,
        );

        $user->update(['avatar_path' => $avatarPath]);

        $companyId = $request->filled('company_id')
            ? $request->integer('company_id')
            : null;

        return response()->json(
            $authContext->forUser($user->fresh(), $companyId)
        );
    }

    public function destroyAvatar(Request $request, AuthContextService $authContext): JsonResponse
    {
        $user = $request->user();

        UserAvatarStorage::delete($user->avatar_path);
        $user->update(['avatar_path' => null]);

        $companyId = $request->filled('company_id')
            ? $request->integer('company_id')
            : null;

        return response()->json(
            $authContext->forUser($user->fresh(), $companyId)
        );
    }

    /**
     * @param  array<string, mixed>|null  $shortcut
     * @return array{ctrl: bool, shift: bool, alt: bool, meta: bool, key: string}|null
     */
    private function normalizeStealthShortcut(?array $shortcut): ?array
    {
        if ($shortcut === null) {
            return null;
        }

        $key = strtolower(trim((string) ($shortcut['key'] ?? '')));

        if ($key === '' || in_array($key, ['control', 'shift', 'alt', 'meta', 'os'], true)) {
            return null;
        }

        $ctrl = (bool) ($shortcut['ctrl'] ?? false);
        $shift = (bool) ($shortcut['shift'] ?? false);
        $alt = (bool) ($shortcut['alt'] ?? false);
        $meta = (bool) ($shortcut['meta'] ?? false);

        if (! $ctrl && ! $shift && ! $alt && ! $meta) {
            return null;
        }

        return [
            'ctrl' => $ctrl,
            'shift' => $shift,
            'alt' => $alt,
            'meta' => $meta,
            'key' => $key === ' ' ? 'space' : $key,
        ];
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user !== null) {
            $token = $user->currentAccessToken();

            if ($token !== null && method_exists($token, 'delete')) {
                $token->delete();
            }

            $user->tokens()->delete();
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out.']);
    }
}
