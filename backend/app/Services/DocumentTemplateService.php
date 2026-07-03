<?php

namespace App\Services;

use App\Enums\DeliveryFormStatus;
use App\Enums\InvoiceStatus;
use App\Enums\QuoteStatus;
use App\Models\Company;
use App\Models\DeliveryForm;
use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Tenant;
use App\Support\TenantLogoStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class DocumentTemplateService
{
    private const BRAND_NAME = 'BTP Pro';

    /**
     * Compile a template by replacing {{placeholder}} and {placeholder} tokens.
     *
     * @param  array<string, scalar|null>  $variables
     */
    public function compile(string $template, array $variables): string
    {
        $normalized = [];

        foreach ($variables as $key => $value) {
            $normalized[(string) $key] = (string) ($value ?? '');
        }

        $compiled = preg_replace_callback(
            '/\{\{\s*([\w.]+)\s*\}\}|\{\s*([\w.]+)\s*\}/',
            static function (array $matches) use ($normalized): string {
                $key = $matches[1] !== '' ? $matches[1] : $matches[2];

                return $normalized[$key] ?? $matches[0];
            },
            $template,
        );

        return $compiled ?? $template;
    }

    /**
     * @return array<string, string>
     */
    public function buildQuoteVariables(Quote $quote): array
    {
        $quote->loadMissing(['client', 'project', 'company', 'lines']);

        return $this->buildCommercialVariables(
            reference: $quote->reference,
            clientName: $quote->client?->name ?? '',
            projectName: $quote->project?->title ?? '',
            totalHt: (float) $quote->total_ht,
            totalTax: (float) $quote->total_tax,
            totalTtc: (float) $quote->total_ttc,
            issuedAt: $quote->issued_at?->format('d/m/Y') ?? '',
            notes: $quote->notes ?? '',
            company: $quote->company,
            tenantId: $quote->tenant_id,
            extra: [
                'valid_until' => $quote->valid_until?->format('d/m/Y') ?? '',
                'status' => $quote->status->value,
            ],
        );
    }

    /**
     * @return array<string, string>
     */
    public function buildInvoiceVariables(Invoice $invoice): array
    {
        $invoice->loadMissing(['client', 'project', 'company', 'lines']);

        return $this->buildCommercialVariables(
            reference: $invoice->reference,
            clientName: $invoice->client?->name ?? '',
            projectName: $invoice->project?->title ?? '',
            totalHt: (float) $invoice->total_ht,
            totalTax: (float) $invoice->total_tax,
            totalTtc: (float) $invoice->total_ttc,
            issuedAt: $invoice->issued_at?->format('d/m/Y') ?? '',
            notes: $invoice->notes ?? '',
            company: $invoice->company,
            tenantId: $invoice->tenant_id,
            extra: [
                'due_date' => $invoice->due_date?->format('d/m/Y') ?? '',
                'amount_paid' => number_format((float) $invoice->amount_paid, 2, ',', ' '),
                'balance_due' => number_format((float) $invoice->balance_due, 2, ',', ' '),
                'status' => $invoice->status->value,
            ],
        );
    }

    /**
     * @return array<string, string>
     */
    public function buildDeliveryFormVariables(DeliveryForm $deliveryForm): array
    {
        $deliveryForm->loadMissing(['client', 'project', 'company', 'lines']);

        $tenant = $this->resolveTenant($deliveryForm->tenant_id);
        $lineCount = $deliveryForm->lines->count();
        $totalQuantity = $deliveryForm->lines->sum(fn ($line) => (float) $line->quantity);

        return [
            'client_name' => $deliveryForm->client?->name ?? '',
            'project_name' => $deliveryForm->project?->title ?? '',
            'reference' => $deliveryForm->reference,
            'delivery_date' => $deliveryForm->delivery_date?->format('d/m/Y') ?? '',
            'description' => $deliveryForm->description ?? '',
            'line_count' => (string) $lineCount,
            'total_quantity' => number_format($totalQuantity, 3, ',', ' '),
            'total_amount' => '—',
            'total_price' => '—',
            'issued_at' => $deliveryForm->delivery_date?->format('d/m/Y') ?? '',
            'date' => now()->translatedFormat('d F Y'),
            'date_short' => now()->format('d/m/Y'),
            'notes' => $deliveryForm->description ?? '',
            'company_name' => $deliveryForm->company?->legal_name ?? $deliveryForm->company?->name ?? '',
            'company_email' => $deliveryForm->company?->email ?? '',
            'company_phone' => $deliveryForm->company?->phone ?? '',
            'tenant_name' => $tenant?->name ?? ($deliveryForm->company?->name ?? ''),
            'status' => $deliveryForm->status->value,
        ];
    }

    /**
     * @return array{name: string|null, logo_url: string|null}
     */
    public function resolveTenantBranding(?int $tenantId): array
    {
        $tenant = $this->resolveTenant($tenantId);

        return [
            'name' => $tenant?->name,
            'logo_url' => TenantLogoStorage::url($tenant?->logo_path),
        ];
    }

    /**
     * @return array{
     *     enabled: bool,
     *     signed: bool,
     *     signed_at: string|null,
     *     signed_via: string,
     *     label: string
     * }
     */
    public function resolveDigitalSignature(Model $document): array
    {
        $signed = $this->isDigitallySigned($document);
        $signedAt = $signed ? $this->resolveSignedAt($document) : null;
        $signatureImage = $this->resolveSignatureImage($document);

        return [
            'enabled' => true,
            'signed' => $signed,
            'signed_at' => $signedAt,
            'signed_via' => self::BRAND_NAME,
            'label' => 'Signature Numérique',
            'signature_image' => $signatureImage,
        ];
    }

    public function renderDigitalSignatureHtml(
        bool $signed = false,
        ?string $signedAt = null,
        string $signerLabel = 'Signature Numérique',
        ?string $signatureImage = null,
    ): string {
        $label = e($signerLabel);
        $brand = e(self::BRAND_NAME);

        if ($signed && $signatureImage !== null) {
            $safeImage = e($signatureImage);
            $signedLine = $signedAt !== null
                ? e("Signé électroniquement le {$signedAt} via ".self::BRAND_NAME)
                : e('Signé électroniquement via '.self::BRAND_NAME);

            return <<<HTML
<div class="digital-signature-box" style="margin-top:48px;display:flex;justify-content:flex-end;">
  <div style="width:280px;border:2px solid #22c55e;border-radius:12px;padding:16px;background:#f0fdf4;text-align:center;">
    <div style="margin-top:4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#166534;">{$label}</div>
    <img src="{$safeImage}" alt="Signature client" style="margin-top:12px;max-height:96px;max-width:100%;object-fit:contain;" />
    <div style="margin-top:10px;font-size:12px;line-height:1.5;color:#15803d;">{$signedLine}</div>
  </div>
</div>
HTML;
        }

        if ($signed && $signedAt !== null) {
            $signedLine = e("Signé électroniquement le {$signedAt} via ".self::BRAND_NAME);

            return <<<HTML
<div class="digital-signature-box" style="margin-top:48px;display:flex;justify-content:flex-end;">
  <div style="width:280px;border:2px solid #22c55e;border-radius:12px;padding:16px;background:#f0fdf4;text-align:center;">
    <div style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:#dcfce7;color:#16a34a;font-size:14px;font-weight:700;">&#10003;</div>
    <div style="margin-top:10px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#166534;">{$label}</div>
    <div style="margin-top:10px;font-size:12px;line-height:1.5;color:#15803d;">{$signedLine}</div>
  </div>
</div>
HTML;
        }

        return <<<HTML
<div class="digital-signature-box" style="margin-top:48px;display:flex;justify-content:flex-end;">
  <div style="width:260px;border:2px dashed #94a3b8;border-radius:12px;padding:16px;background:#f8fafc;text-align:center;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">{$label}</div>
    <div style="margin-top:28px;height:64px;border-bottom:1px solid #cbd5e1;"></div>
    <div style="margin-top:8px;font-size:11px;color:#94a3b8;">Date : ____________________</div>
    <div style="margin-top:6px;font-size:10px;color:#cbd5e1;">via {$brand}</div>
  </div>
</div>
HTML;
    }

    public function appendSignatureToHtml(string $html, bool $signed = false, ?string $signedAt = null): string
    {
        return $html.$this->renderDigitalSignatureHtml($signed, $signedAt);
    }

    public function defaultQuoteFooterTemplate(): string
    {
        return <<<'TEXT'
Document {{reference}} émis le {{issued_at}} pour {{client_name}}.
Projet : {{project_name}} — Total TTC : {{total_amount}} MAD.
TEXT;
    }

    public function defaultInvoiceFooterTemplate(): string
    {
        return <<<'TEXT'
Facture {{reference}} — Client : {{client_name}} — Projet : {{project_name}}.
Montant TTC : {{total_amount}} MAD — Échéance : {{due_date}}.
TEXT;
    }

    public function defaultDeliveryFormFooterTemplate(): string
    {
        return <<<'TEXT'
Bon de livraison {{reference}} — Client : {{client_name}} — Projet : {{project_name}}.
Date de livraison : {{delivery_date}} — Articles livrés : {{line_count}}.
TEXT;
    }

    /**
     * @return array<string, mixed>
     */
    public function buildQuotePreview(Quote $quote, ?string $template = null): array
    {
        return $this->buildPreview(
            documentType: 'quote',
            variables: $this->buildQuoteVariables($quote),
            template: $template ?? $this->defaultQuoteFooterTemplate(),
            document: $quote,
            tenantId: $quote->tenant_id,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function buildInvoicePreview(Invoice $invoice, ?string $template = null): array
    {
        return $this->buildPreview(
            documentType: 'invoice',
            variables: $this->buildInvoiceVariables($invoice),
            template: $template ?? $this->defaultInvoiceFooterTemplate(),
            document: $invoice,
            tenantId: $invoice->tenant_id,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function buildDeliveryFormPreview(DeliveryForm $deliveryForm, ?string $template = null): array
    {
        return $this->buildPreview(
            documentType: 'delivery_form',
            variables: $this->buildDeliveryFormVariables($deliveryForm),
            template: $template ?? $this->defaultDeliveryFormFooterTemplate(),
            document: $deliveryForm,
            tenantId: $deliveryForm->tenant_id,
        );
    }

    /**
     * @param  array<string, string>  $variables
     * @return array<string, mixed>
     */
    private function buildPreview(
        string $documentType,
        array $variables,
        string $template,
        Model $document,
        ?int $tenantId,
    ): array {
        $signature = $this->resolveDigitalSignature($document);
        $tenant = $this->resolveTenantBranding($tenantId);
        $compiledFooter = $this->compile($template, $variables);

        return [
            'document_type' => $documentType,
            'variables' => $variables,
            'compiled_footer' => $compiledFooter,
            'tenant' => $tenant,
            'signature' => $signature,
            'signature_html' => $this->renderDigitalSignatureHtml(
                $signature['signed'],
                $signature['signed_at'],
                $signature['label'],
                $signature['signature_image'] ?? null,
            ),
        ];
    }

    /**
     * @param  array<string, string>  $extra
     * @return array<string, string>
     */
    private function buildCommercialVariables(
        string $reference,
        string $clientName,
        string $projectName,
        float $totalHt,
        float $totalTax,
        float $totalTtc,
        string $issuedAt,
        string $notes,
        ?Company $company,
        ?int $tenantId,
        array $extra = [],
    ): array {
        $tenant = $this->resolveTenant($tenantId);
        $formattedTtc = number_format($totalTtc, 2, ',', ' ');

        return array_merge([
            'client_name' => $clientName,
            'project_name' => $projectName,
            'reference' => $reference,
            'total_ht' => number_format($totalHt, 2, ',', ' '),
            'total_tax' => number_format($totalTax, 2, ',', ' '),
            'total_price' => $formattedTtc,
            'total_ttc' => $formattedTtc,
            'total_amount' => $formattedTtc,
            'issued_at' => $issuedAt,
            'date' => now()->translatedFormat('d F Y'),
            'date_short' => now()->format('d/m/Y'),
            'notes' => $notes,
            'company_name' => $company?->legal_name ?? $company?->name ?? '',
            'company_email' => $company?->email ?? '',
            'company_phone' => $company?->phone ?? '',
            'tenant_name' => $tenant?->name ?? ($company?->name ?? ''),
        ], $extra);
    }

    private function resolveTenant(?int $tenantId): ?Tenant
    {
        return $tenantId !== null ? Tenant::query()->find($tenantId) : null;
    }

    private function isDigitallySigned(Model $document): bool
    {
        return match (true) {
            $document instanceof Quote => $document->client_signature_data !== null
                || $document->status === QuoteStatus::Accepted,
            $document instanceof Invoice => in_array($document->status, [
                InvoiceStatus::Sent,
                InvoiceStatus::PartiallyPaid,
                InvoiceStatus::Paid,
                InvoiceStatus::Overdue,
            ], true),
            $document instanceof DeliveryForm => in_array($document->status, [
                DeliveryFormStatus::Signed,
                DeliveryFormStatus::SignedAndStamped,
            ], true),
            default => false,
        };
    }

    private function resolveSignedAt(Model $document): string
    {
        if ($document instanceof Quote && $document->client_signed_at !== null) {
            return Carbon::parse($document->client_signed_at)->format('d/m/Y');
        }

        $timestamp = $document->updated_at ?? now();

        return Carbon::parse($timestamp)->format('d/m/Y');
    }

    private function resolveSignatureImage(Model $document): ?string
    {
        if ($document instanceof Quote && $document->client_signature_data !== null) {
            return $document->client_signature_data;
        }

        return null;
    }
}
