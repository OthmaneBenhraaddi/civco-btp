<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_admin_context_is_available_without_login(): void
    {
        $this->seed();

        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'admin@btpdemo.fr')
            ->assertJsonPath('company.name', 'BTP Groupe')
            ->assertJsonPath('permissions', fn ($permissions) => in_array('dashboard.view', $permissions, true));
    }

    public function test_demo_admin_context_fails_when_seeded_user_is_inactive(): void
    {
        $this->seed();

        \App\Models\User::query()->where('email', 'admin@btpdemo.fr')->update(['is_active' => false]);

        $this->getJson('/api/v1/me')->assertStatus(503);
    }
}
