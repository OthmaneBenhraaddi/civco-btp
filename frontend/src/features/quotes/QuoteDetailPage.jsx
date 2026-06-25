import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PermissionGate from '../../components/PermissionGate'
import Modal from '../../components/Modal'
import StatusBadge from '../../components/StatusBadge'
import CommercialPrintSheet from '../../components/print/CommercialPrintSheet'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { useCommercialPrint } from '../../hooks/useCommercialPrint'
import * as deliveryFormsApi from '../../api/deliveryForms'
import * as quotesApi from '../../api/quotes'
import { extractErrorMessage, unwrapResource } from '../../utils/apiHelpers'
import { formatMoney } from '../../utils/currency'
import {
  logQuoteConverted,
  logQuoteDeleted,
  logQuoteUpdated,
  resolveActorLabel,
} from '../history/auditLogActions'

const emptyLine = {
  description: '',
  quantity: '1',
  unit_price_ht: '',
  tax_rate: '20',
}

export default function QuoteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission, user, roles } = useAuth()
  const { t, locale } = useTranslation()
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lineForm, setLineForm] = useState(emptyLine)
  const [savingLine, setSavingLine] = useState(false)
  const [converting, setConverting] = useState(false)
  const [blModalOpen, setBlModalOpen] = useState(false)
  const [selectedLineIds, setSelectedLineIds] = useState([])
  const [generatingBl, setGeneratingBl] = useState(false)

  const canEdit = quote?.status === 'draft' && hasPermission('quote.manage')
  const lines = unwrapResource(quote?.lines)

  async function loadQuote() {
    setLoading(true)
    setError('')

    try {
      const data = await quotesApi.fetchQuote(id)
      setQuote(data.data ?? data)
    } catch (err) {
      setError(extractErrorMessage(err, t('quotes.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuote()
  }, [id])

  async function handleStatusChange(status) {
    setError('')
    try {
      await quotesApi.updateQuote(id, { status })
      logQuoteUpdated({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        reference: quote?.reference ?? id,
        detail: `A changé le statut du devis ${quote?.reference ?? id} en « ${t(`status.${status}`)} »`,
      })
      await loadQuote()
    } catch (err) {
      setError(extractErrorMessage(err, t('quotes.updateError')))
    }
  }

  async function handleAddLine(event) {
    event.preventDefault()
    setSavingLine(true)
    setError('')

    try {
      await quotesApi.addQuoteLine(id, {
        description: lineForm.description,
        quantity: Number(lineForm.quantity),
        unit_price_ht: Number(lineForm.unit_price_ht),
        tax_rate: Number(lineForm.tax_rate),
      })
      logQuoteUpdated({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        reference: quote?.reference ?? id,
        detail: `A ajouté une ligne au devis ${quote?.reference ?? id}`,
      })
      setLineForm(emptyLine)
      await loadQuote()
    } catch (err) {
      setError(extractErrorMessage(err, t('quotes.lineSaveError')))
    } finally {
      setSavingLine(false)
    }
  }

  async function handleDeleteLine(lineId) {
    if (!window.confirm(t('quotes.deleteLineConfirm'))) {
      return
    }

    try {
      await quotesApi.deleteQuoteLine(lineId)
      logQuoteUpdated({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        reference: quote?.reference ?? id,
        detail: `A supprimé une ligne du devis ${quote?.reference ?? id}`,
      })
      await loadQuote()
    } catch (err) {
      setError(extractErrorMessage(err, t('quotes.lineDeleteError')))
    }
  }

  async function handleConvert() {
    if (!window.confirm(t('quotes.convertConfirm'))) {
      return
    }

    setConverting(true)
    setError('')

    try {
      const data = await quotesApi.convertQuoteToInvoice(id)
      const invoice = data.data ?? data
      logQuoteConverted({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        quoteReference: quote?.reference ?? id,
        invoiceReference: invoice?.reference ?? invoice?.id,
      })
      navigate(`/invoices/${invoice.id}`)
    } catch (err) {
      setError(extractErrorMessage(err, t('quotes.convertError')))
    } finally {
      setConverting(false)
    }
  }

  function openBlModal() {
    setSelectedLineIds(lines.map((line) => line.id))
    setBlModalOpen(true)
  }

  function toggleBlLine(lineId) {
    setSelectedLineIds((current) => (
      current.includes(lineId)
        ? current.filter((item) => item !== lineId)
        : [...current, lineId]
    ))
  }

  async function handleGenerateBl(event) {
    event.preventDefault()

    if (selectedLineIds.length === 0) {
      setError(t('deliveryForms.needLines'))
      return
    }

    setGeneratingBl(true)
    setError('')

    try {
      const data = await deliveryFormsApi.convertQuoteToDeliveryForm(id, {
        line_ids: selectedLineIds,
      })
      const deliveryForm = data.data ?? data
      setBlModalOpen(false)
      navigate(`/delivery-forms/${deliveryForm.id}`)
    } catch (err) {
      setError(extractErrorMessage(err, t('quotes.generateBlError')))
    } finally {
      setGeneratingBl(false)
    }
  }

  const deliveryForms = quote?.delivery_forms ?? []

  const incrementPrint = useCallback(async () => {
    const data = await quotesApi.incrementQuotePrint(id)
    setQuote(data.data ?? data)
  }, [id])

  const { copyVariant, printing, handlePrint } = useCommercialPrint({
    printCount: quote?.print_count,
    onIncrement: incrementPrint,
  })

  if (loading) {
    return <p>{t('common.loading')}</p>
  }

  if (!quote) {
    return <p className="error">{t('quotes.notFound')}</p>
  }

  return (
    <>
    <div className="no-print">
      <p className="breadcrumb">
        <Link to="/quotes">{t('quotes.title')}</Link> / {quote.reference}
      </p>

      <header className="page-header">
        <div>
          <h1>{quote.reference}</h1>
          <div className="inline-meta">
            <StatusBadge status={quote.status} />
            <span>{quote.client?.name}</span>
            {quote.project ? (
              <Link to={`/projects/${quote.project.id}`}>{quote.project.title}</Link>
            ) : null}
          </div>
        </div>
        <div className="actions">
          {hasPermission('quote.view') && lines.length > 0 ? (
            <button
              type="button"
              className="ghost"
              onClick={async () => {
                setError('')
                try {
                  await handlePrint()
                } catch (err) {
                  setError(extractErrorMessage(err, t('print.printError')))
                }
              }}
              disabled={printing}
            >
              {printing ? t('print.printing') : t('print.print')}
            </button>
          ) : null}
          {canEdit && lines.length > 0 ? (
            <button type="button" className="ghost" onClick={() => handleStatusChange('sent')}>
              {t('quotes.markSent')}
            </button>
          ) : null}
          {hasPermission('quote.manage') && quote.status === 'sent' ? (
            <>
              <button type="button" className="ghost" onClick={() => handleStatusChange('accepted')}>
                {t('quotes.markAccepted')}
              </button>
              <button type="button" className="ghost danger" onClick={() => handleStatusChange('rejected')}>
                {t('quotes.markRejected')}
              </button>
            </>
          ) : null}
          {hasPermission('delivery_form.manage') && quote.status === 'accepted' && lines.length > 0 ? (
            <button type="button" className="ghost" onClick={openBlModal}>
              {t('quotes.generateBl')}
            </button>
          ) : null}
          {hasPermission('invoice.manage') && quote.status === 'accepted' && !quote.invoice ? (
            <button type="button" onClick={handleConvert} disabled={converting || lines.length === 0}>
              {converting ? t('quotes.converting') : t('quotes.convertToInvoice')}
            </button>
          ) : null}
          {quote.invoice ? (
            <Link to={`/invoices/${quote.invoice.id}`} className="btn-action">
              {t('quotes.viewInvoice', { reference: quote.invoice.reference })}
            </Link>
          ) : null}
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="card summary-card">
        <div className="summary-grid">
          <div>
            <span className="summary-label">{t('quotes.issuedAt')}</span>
            <strong>{quote.issued_at ?? '—'}</strong>
          </div>
          <div>
            <span className="summary-label">{t('quotes.validUntil')}</span>
            <strong>{quote.valid_until ?? '—'}</strong>
          </div>
          <div>
            <span className="summary-label">{t('quotes.totalHt')}</span>
            <strong>{formatMoney(quote.total_ht, locale)}</strong>
          </div>
          <div>
            <span className="summary-label">{t('quotes.totalTtc')}</span>
            <strong>{formatMoney(quote.total_ttc, locale)}</strong>
          </div>
        </div>
        {quote.notes ? <p className="hint">{quote.notes}</p> : null}
        {deliveryForms.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {deliveryForms.map((item) => (
              <Link key={item.id} to={`/delivery-forms/${item.id}`} className="btn-action">
                {item.reference}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <h2>{t('quotes.lines')}</h2>

      {canEdit ? (
        <form className="inline-form line-form" onSubmit={handleAddLine}>
          <label>
            {t('quotes.lineDescription')}
            <input
              value={lineForm.description}
              onChange={(event) => setLineForm({ ...lineForm, description: event.target.value })}
              required
            />
          </label>
          <label>
            {t('quotes.quantity')}
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={lineForm.quantity}
              onChange={(event) => setLineForm({ ...lineForm, quantity: event.target.value })}
              required
            />
          </label>
          <label>
            {t('quotes.unitPriceHt')}
            <input
              type="number"
              min="0"
              step="0.01"
              value={lineForm.unit_price_ht}
              onChange={(event) => setLineForm({ ...lineForm, unit_price_ht: event.target.value })}
              required
            />
          </label>
          <label>
            {t('quotes.taxRate')}
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={lineForm.tax_rate}
              onChange={(event) => setLineForm({ ...lineForm, tax_rate: event.target.value })}
              required
            />
          </label>
          <button type="submit" disabled={savingLine}>
            {savingLine ? t('common.saving') : t('quotes.addLine')}
          </button>
        </form>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('quotes.lineDescription')}</th>
              <th>{t('quotes.quantity')}</th>
              <th>{t('quotes.unitPriceHt')}</th>
              <th>{t('quotes.taxRate')}</th>
              <th>{t('quotes.lineTotalTtc')}</th>
              {canEdit ? <th>{t('common.actions')}</th> : null}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 6 : 5}>{t('quotes.noLines')}</td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{formatMoney(line.unit_price_ht, locale)}</td>
                  <td>{line.tax_rate}%</td>
                  <td>{formatMoney(line.line_total_ttc, locale)}</td>
                  {canEdit ? (
                    <td>
                      <button type="button" className="ghost danger" onClick={() => handleDeleteLine(line.id)}>
                        {t('common.delete')}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal title={t('quotes.generateBl')} open={blModalOpen} onClose={() => setBlModalOpen(false)}>
        <form className="stack" onSubmit={handleGenerateBl}>
          <p className="hint">{t('quotes.generateBlHint')}</p>
          <div className="flex flex-col gap-2">
            {lines.map((line) => (
              <label key={line.id} className="checkbox flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedLineIds.includes(line.id)}
                  onChange={() => toggleBlLine(line.id)}
                />
                <span>{line.description} ({line.quantity})</span>
              </label>
            ))}
          </div>
          <button type="submit" disabled={generatingBl || selectedLineIds.length === 0}>
            {generatingBl ? t('quotes.generatingBl') : t('quotes.generateBl')}
          </button>
        </form>
      </Modal>
    </div>

    <div className="print-only">
      <CommercialPrintSheet
        documentType="quote"
        reference={quote.reference}
        clientName={quote.client?.name}
        projectTitle={quote.project?.title}
        issuedAt={quote.issued_at}
        secondaryDate={quote.valid_until}
        secondaryDateLabel={t('quotes.validUntil')}
        notes={quote.notes}
        lines={lines}
        totalHt={quote.total_ht}
        totalTax={quote.total_tax}
        totalTtc={quote.total_ttc}
        copyVariant={copyVariant}
      />
    </div>
    </>
  )
}
