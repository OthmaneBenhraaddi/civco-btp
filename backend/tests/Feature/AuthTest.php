<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_fetch_profile(): void
    {
        $this->seed();

        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Accept' => 'application/json',
        ])->post('/api/v1/login', [
            'email' => 'admin@btpdemo.fr',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'admin@btpdemo.fr')
            ->assertJsonPath('company.name', 'BTP Groupe');

        $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Accept' => 'application/json',
        ])->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('permissions', fn ($permissions) => in_array('dashboard.view', $permissions, true));
    }

    public function test_inactive_user_cannot_login(): void
    {
        $this->seed();

        \App\Models\User::query()->where('email', 'admin@btpdemo.fr')->update(['is_active' => false]);

        $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Accept' => 'application/json',
        ])->post('/api/v1/login', [
            'email' => 'admin@btpdemo.fr',
            'password' => 'password',
        ])->assertUnprocessable();
    }
}
