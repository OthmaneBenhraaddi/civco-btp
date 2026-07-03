<?php

namespace App\Services;

use App\Enums\QuoteStatus;
use App\Models\Client;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ClientPortalQuoteService
{
    public function __construct(
        private readonly DocumentTemplateService $documentTemplateService,
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * @return Collection<int, Quote>
     */
    public function quotesForClient(Client $client): Collection
    {
        return $this->baseClientQuoteQuery($client)
            ->whereIn('status', [QuoteStatus::Sent, QuoteStatus::Accepted])
            ->with(['project:id,reference,title', 'lines'])
            ->orderByDesc('issued_at')
            ->orderByDesc('created_at')
            ->get();
    }

    public function resolveQuoteForClient(Client $client, Quote $quote): Quote
    {
        $quote = $this->baseClientQuoteQuery($client)
            ->whereKey($quote->id)
            ->first();

        if ($quote === null) {
            abort(404);
        }

        if (! in_array($quote->status, [QuoteStatus::Sent, QuoteStatus::Accepted], true)) {
            abort(404);
        }

        return $quote->load(['project:id,reference,title', 'lines', 'client:id,name']);
    }

    private function baseClientQuoteQuery(Client $client)
    {
        return Quote::query()
            ->withoutGlobalScope('tenant')
            ->where('client_id', $client->id)
            ->when(
                $client->tenant_id !== null,
                fn ($query) => $query->where(function ($builder) use ($client): void {
                    $builder
                        ->where('tenant_id', $client->tenant_id)
                        ->orWhereNull('tenant_id');
                }),
            );
    }

    /**
     * @return array<string, mixed>
     */
    public function buildPreview(Quote $quote): array
    {
        return $this->documentTemplateService->buildQuotePreview($quote);
    }

    public function acceptQuote(Quote $quote, User $user, string $signatureData): Quote
    {
        if ($quote->status !== QuoteStatus::Sent) {
            throw new InvalidArgumentException('Ce devis ne peut plus être accepté.');
        }

        if ($quote->client_signature_data !== null) {
            throw new InvalidArgumentException('Ce devis a déjà été signé.');
        }

        if ($user->client_id === null || (int) $user->client_id !== (int) $quote->client_id) {
            throw new AccessDeniedHttpException('Vous ne pouvez pas signer ce devis.');
        }

        $quote->update([
            'client_signature_data' => $signatureData,
            'client_signed_at' => now(),
            'status' => QuoteStatus::Accepted,
        ]);

        $quote = $quote->fresh()->load(['project:id,reference,title', 'lines', 'client:id,name']);

        if ($quote->tenant_id !== null) {
            $this->notificationService->notifyQuoteSigned($quote, $user);
        }

        return $quote;
    }
}
