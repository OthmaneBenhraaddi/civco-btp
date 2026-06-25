<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuoteInvoiceTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): User
    {
        $this->seed();

        $user = User::query()->where('email', 'admin@btpdemo.fr')->firstOrFail();
        $this->actingAs($user);

        return $user;
    }

    private function authHeaders(): array
    {
        return [
            'Origin' => 'http://localhost:5173',
            'Accept' => 'application/json',
        ];
    }

    private function createClient(): Client
    {
        $company = Company::query()->where('siret', '12345678901234')->firstOrFail();

        return Client::query()->create([
            'company_id' => $company->id,
            'name' => 'Commercial Client',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_manage_quote_to_invoice_flow(): void
    {
        $this->actingAsAdmin();
        $client = $this->createClient();

        $quoteResponse = $this->withHeaders($this->authHeaders())->postJson('/api/v1/quotes', [
            'client_id' => $client->id,
            'issued_at' => '2026-06-01',
            'valid_until' => '2026-07-01',
        ]);

        $quoteResponse->assertCreated()
            ->assertJsonPath('data.status', 'draft');

        $quoteId = $quoteResponse->json('data.id');

        $this->withHeaders($this->authHeaders())->postJson("/api/v1/quotes/{$quoteId}/lines", [
            'description' => 'Travaux de maçonnerie',
            'quantity' => 10,
            'unit_price_ht' => 500,
            'tax_rate' => 20,
        ])->assertCreated();

        $this->withHeaders($this->authHeaders())->putJson("/api/v1/quotes/{$quoteId}", [
            'status' => 'sent',
        ])->assertOk()
            ->assertJsonPath('data.status', 'sent');

        $this->withHeaders($this->authHeaders())->putJson("/api/v1/quotes/{$quoteId}", [
            'status' => 'accepted',
        ])->assertOk()
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.total_ttc', 6000);

        $invoiceResponse = $this->withHeaders($this->authHeaders())->postJson(
            "/api/v1/quotes/{$quoteId}/convert-to-invoice",
        );

        $invoiceResponse->assertCreated()
            ->assertJsonPath('data.total_ttc', 6000);

        $invoiceId = $invoiceResponse->json('data.id');

        $this->withHeaders($this->authHeaders())->putJson("/api/v1/invoices/{$invoiceId}", [
            'status' => 'sent',
        ])->assertOk()
            ->assertJsonPath('data.status', 'sent');

        $this->withHeaders($this->authHeaders())->postJson("/api/v1/invoices/{$invoiceId}/payments", [
            'amount' => 3000,
            'paid_at' => '2026-06-10',
            'method' => 'bank_transfer',
            'reference' => 'VIR-001',
        ])->assertCreated();

        $this->withHeaders($this->authHeaders())->getJson("/api/v1/invoices/{$invoiceId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'partially_paid')
            ->assertJsonPath('data.amount_paid', 3000)
            ->assertJsonPath('data.balance_due', 3000);
    }
}
