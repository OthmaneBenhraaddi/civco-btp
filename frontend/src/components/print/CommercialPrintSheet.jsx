import PrintCopyBadge from './PrintCopyBadge'
import { useTranslation } from '../../i18n/LanguageContext'
import { formatMoney } from '../../utils/currency'

export default function CommercialPrintSheet({
  documentType,
  reference,
  clientName,
  projectTitle,
  issuedAt,
  secondaryDate,
  secondaryDateLabel,
  notes,
  lines,
  totalHt,
  totalTax,
  totalTtc,
  extraSummary = [],
  copyVariant,
}) {
  const { t, locale } = useTranslation()

  const title = documentType === 'invoice' ? t('invoices.title') : t('quotes.title')

  return (
    <div className="commercial-print-sheet mx-auto max-w-[210mm] bg-white p-10 text-slate-900">
      <div className="commercial-print-watermark" aria-hidden>
        {copyVariant === 'copy' ? t('print.copy') : ''}
      </div>

      <header className="mb-8 flex items-start justify-between gap-6 border-b border-slate-300 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">CIVCO BTP</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-lg font-semibold text-slate-800">{reference}</p>
        </div>
        <PrintCopyBadge variant={copyVariant} />
      </header>

      <section className="mb-8 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('quotes.client')}</p>
          <p className="mt-1 font-medium text-slate-900">{clientName ?? '—'}</p>
          {projectTitle ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('quotes.project')}</p>
              <p className="mt-1 font-medium text-slate-900">{projectTitle}</p>
            </>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('quotes.issuedAt')}</p>
          <p className="mt-1 font-medium text-slate-900">{issuedAt ?? '—'}</p>
          {secondaryDateLabel ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{secondaryDateLabel}</p>
              <p className="mt-1 font-medium text-slate-900">{secondaryDate ?? '—'}</p>
            </>
          ) : null}
        </div>
      </section>

      <table className="commercial-print-table mb-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-800">
            <th className="py-2 text-left font-semibold">{t('quotes.lineDescription')}</th>
            <th className="py-2 text-right font-semibold">{t('quotes.quantity')}</th>
            <th className="py-2 text-right font-semibold">{t('quotes.unitPriceHt')}</th>
            <th className="py-2 text-right font-semibold">{t('quotes.taxRate')}</th>
            <th className="py-2 text-right font-semibold">{t('quotes.lineTotalTtc')}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b border-slate-200">
              <td className="py-2 pr-4">{line.description}</td>
              <td className="py-2 text-right tabular-nums">{line.quantity}</td>
              <td className="py-2 text-right tabular-nums">{formatMoney(line.unit_price_ht, locale)}</td>
              <td className="py-2 text-right tabular-nums">{line.tax_rate}%</td>
              <td className="py-2 text-right tabular-nums">{formatMoney(line.line_total_ttc, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="ml-auto w-full max-w-xs space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-600">{t('quotes.totalHt')}</span>
          <strong className="tabular-nums">{formatMoney(totalHt, locale)}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-600">{t('quotes.totalTax')}</span>
          <strong className="tabular-nums">{formatMoney(totalTax, locale)}</strong>
        </div>
        {extraSummary.map((item) => (
          <div key={item.label} className="flex justify-between gap-4">
            <span className="text-slate-600">{item.label}</span>
            <strong className="tabular-nums">{item.value}</strong>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t border-slate-300 pt-2 text-base">
          <span className="font-semibold">{t('quotes.totalTtc')}</span>
          <strong className="tabular-nums">{formatMoney(totalTtc, locale)}</strong>
        </div>
      </section>

      {notes ? (
        <p className="mt-8 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{t('quotes.notes')}: </span>
          {notes}
        </p>
      ) : null}
    </div>
  )
}
