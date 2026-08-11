<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Middleware\CheckUserStatus;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\ActivityLogService;
use App\Services\AdminCredentialService;
use App\Services\AuthContextService;
use App\Support\TenantAuthGuard;
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
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'stealth_shortcut' => ['sometimes', 'nullable', 'array'],
            'stealth_shortcut.ctrl' => ['required_with:stealth_shortcut', 'boolean'],
            'stealth_shortcut.shift' => ['required_with:stealth_shortcut', 'boolean'],
            'stealth_shortcut.alt' => ['required_with:stealth_shortcut', 'boolean'],
            'stealth_shortcut.meta' => ['required_with:stealth_shortcut', 'boolean'],
            'stealth_shortcut.key' => ['required_with:stealth_shortcut', 'string', 'max:32'],
        ]);

        $updates = [];

        if (array_key_exists('email', $validated)) {
            $updates['email'] = $validated['email'];
        }

        if (! empty($validated['password'])) {
            $updates['password'] = bcrypt($validated['password']);
        }

        if (array_key_exists('stealth_shortcut', $validated)) {
            $updates['stealth_shortcut'] = $this->normalizeStealthShortcut($validated['stealth_shortcut']);
        }

        if ($updates !== []) {
            $user->update($updates);
        }

        $emailChanged = array_key_exists('email', $validated) && $previousEmail !== $validated['email'];
        $passwordChanged = ! empty($validated['password']);

        if ($emailChanged || $passwordChanged) {
            $freshUser = $user->fresh()->loadMissing(['companies', 'roles']);
            $roleLabel = $freshUser->roles->first()?->name ?? $freshUser->job_title ?? 'Membre';
            if ($passwordChanged) {
                app(AdminCredentialService::class)->storeProvisionedPassword($freshUser, $validated['password']);
            }
            app(ActivityLogService::class)->logCredentialsUpdated(
                $freshUser,
                $roleLabel,
                $freshUser->email,
                $emailChanged,
                $passwordChanged,
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
