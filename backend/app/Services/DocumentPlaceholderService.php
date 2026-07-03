<?php

namespace App\Services;

use App\Models\DeliveryForm;
use App\Models\Invoice;
use App\Models\Quote;

/**
 * Backward-compatible facade over {@see DocumentTemplateService}.
 */
class DocumentPlaceholderService
{
    public function __construct(
        private readonly DocumentTemplateService $documentTemplateService,
    ) {}

    /**
     * @param  array<string, string>  $variables
     */
    public function replace(string $template, array $variables): string
    {
        return $this->documentTemplateService->compile($template, $variables);
    }

    /**
     * @return array<string, string>
     */
    public function buildQuoteVariables(Quote $quote): array
    {
        return $this->documentTemplateService->buildQuoteVariables($quote);
    }

    /**
     * @return array<string, string>
     */
    public function buildInvoiceVariables(Invoice $invoice): array
    {
        return $this->documentTemplateService->buildInvoiceVariables($invoice);
    }

    /**
     * @return array<string, string>
     */
    public function buildDeliveryFormVariables(DeliveryForm $deliveryForm): array
    {
        return $this->documentTemplateService->buildDeliveryFormVariables($deliveryForm);
    }

    public function renderDigitalSignatureHtml(string $signerLabel = 'Signature Numérique'): string
    {
        return $this->documentTemplateService->renderDigitalSignatureHtml(
            signerLabel: $signerLabel,
        );
    }

    public function appendSignatureToHtml(string $html, string $signerLabel = 'Signature Numérique'): string
    {
        return $this->documentTemplateService->appendSignatureToHtml($html);
    }

    public function defaultQuoteFooterTemplate(): string
    {
        return $this->documentTemplateService->defaultQuoteFooterTemplate();
    }

    public function defaultInvoiceFooterTemplate(): string
    {
        return $this->documentTemplateService->defaultInvoiceFooterTemplate();
    }

    public function defaultDeliveryFormFooterTemplate(): string
    {
        return $this->documentTemplateService->defaultDeliveryFormFooterTemplate();
    }
}
