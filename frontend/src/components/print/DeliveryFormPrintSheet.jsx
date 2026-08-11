import PrintCopyBadge from './PrintCopyBadge'
import DigitalSignatureBox from './DigitalSignatureBox'
import { useTranslation } from '../../i18n/LanguageContext'

function resolveCopyLabel(copyStrength, t) {
  if (copyStrength === 'duplicate') {
    return t('print.duplicate')
  }

  if (copyStrength === 'copy') {
    return t('print.copy')
  }

  return null
}

export default function DeliveryFormPrintSheet({
  reference,
  clientName,
  projectTitle,
  deliveryDate,
  description,
  compiledFooter,
  lines,
  isCopy = false,
  copyStrength = null,
  watermarkLabel = null,
  includeHeader = true,
  tenantLogoUrl,
  tenantName,
  company = null,
  signature,
}) {
  const { t } = useTranslation()
  const brandLabel = tenantName ?? company?.legal_name ?? company?.name ?? t('print.brandName')
  const copyLabel = isCopy ? resolveCopyLabel(copyStrength, t) : null
  const addressLines = [
    company?.address_line1,
    company?.address_line2,
    [company?.postal_code, company?.city].filter(Boolean).join(' '),
    company?.siret ? `${t('print.siret')} : ${company.siret}` : null,
    company?.phone,
    company?.email,
  ].filter(Boolean)

  return (
    <div className="commercial-print-sheet mx-auto max-w-[210mm] bg-white p-10 text-slate-900">
      {isCopy && watermarkLabel ? (
        <div className="commercial-print-watermark commercial-print-watermark-copy" aria-hidden>
          {watermarkLabel}
        </div>
      ) : null}

      <header className="mb-8 flex items-start justify-between gap-6 border-b border-slate-300 pb-6">
        <div className="flex min-w-0 items-start gap-4">
          {includeHeader && tenantLogoUrl ? (
            <img
              src={tenantLogoUrl}
              alt={brandLabel}
              className="max-h-16 max-w-[180px] shrink-0 object-contain object-left"
            />
          ) : null}
          <div className="min-w-0">
            {includeHeader ? (
              <>
                <p className="policy-print-tenant-header text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {brandLabel}
                </p>
                {addressLines.length > 0 ? (
                  <div className="mt-1 space-y-0.5 text-[11px] leading-snug text-slate-600">
                    {addressLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
            <h1 className={`${includeHeader ? 'mt-2' : 'mt-0'} text-2xl font-bold text-slate-900`}>
              {t('deliveryForms.title')}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-lg font-semibold text-slate-800">
              <span>{reference}</span>
              {copyLabel ? (
                <span className="rounded border-2 border-rose-600 px-2 py-0.5 text-xs font-black uppercase tracking-[0.25em] text-rose-700">
                  {copyLabel}
                </span>
              ) : null}
            </p>
          </div>
        </div>
        {copyLabel ? <PrintCopyBadge label={copyLabel} /> : null}
      </header>

      <section className="mb-8 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('deliveryForms.client')}</p>
          <p className="mt-1 font-medium text-slate-900">{clientName ?? '—'}</p>
          {projectTitle ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('deliveryForms.project')}</p>
              <p className="mt-1 font-medium text-slate-900">{projectTitle}</p>
            </>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('deliveryForms.deliveryDate')}</p>
          <p className="mt-1 font-medium text-slate-900">{deliveryDate ?? '—'}</p>
        </div>
      </section>

      {description ? (
        <p className="mb-6 text-sm text-slate-600">{description}</p>
      ) : null}

      <table className="commercial-print-table mb-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-800">
            <th className="py-2 text-left font-semibold">{t('deliveryForms.lineDescription')}</th>
            <th className="py-2 text-right font-semibold">{t('deliveryForms.quantity')}</th>
            <th className="py-2 text-left font-semibold">{t('deliveryForms.phase')}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b border-slate-200">
              <td className="py-2 pr-4">{line.description}</td>
              <td className="py-2 text-right tabular-nums">{line.quantity}</td>
              <td className="py-2">{line.project_phase?.name ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {compiledFooter ? (
        <p className="mt-6 text-sm leading-relaxed text-slate-600">{compiledFooter}</p>
      ) : null}

      <DigitalSignatureBox
        label={signature?.label}
        signed={signature?.signed}
        signedAt={signature?.signed_at}
        signedVia={signature?.signed_via}
      />
    </div>
  )
}
