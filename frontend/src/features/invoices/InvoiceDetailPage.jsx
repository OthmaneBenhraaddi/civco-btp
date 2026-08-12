import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PermissionGate from '../../components/PermissionGate'
import StatusBadge from '../../components/StatusBadge'
import CutSelect from '../../components/prodigy/CutSelect'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as invoicesApi from '../../api/invoices'
import { extractErrorMessage, unwrapResource } from '../../utils/apiHelpers'
import { formatMoney } from '../../utils/currency'
import {
  logInvoiceUpdated,
  logPaymentDeleted,
  logPaymentRecorded,
  resolveActorLabel,
} from '../history/auditLogActions'

const emptyLine = {
  description: '',
  quantity: '1',
  unit_price_ht: '',
  tax_rate: '20',
}

const emptyPayment = {
  amount: '',
  paid_at: new Date().toISOString().slice(0, 10),
  method: 'bank_transfer',
  reference: '',
  notes: '',
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const { hasPermission, user, roles } = useAuth()
  const { t, locale } = useTranslation()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lineForm, setLineForm] = useState(emptyLine)
  const [paymentForm, setPaymentForm] = useState(emptyPayment)
  const [savingLine, setSavingLine] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)

  const canEditLines = invoice?.status === 'draft' && hasPermission('invoice.manage')
  const canRecordPayment = hasPermission('payment.record')
    && invoice
    && !['draft', 'cancelled', 'paid'].includes(invoice.status)
    && invoice.balance_due > 0

  const lines = unwrapResource(invoice?.lines)
  const payments = unwrapResource(invoice?.payments)

  async function loadInvoice() {
    setLoading(true)
    setError('')

    try {
      const data = await invoicesApi.fetchInvoice(id)
      setInvoice(data.data ?? data)
    } catch (err) {
      setError(extractErrorMessage(err, t('invoices.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoice()
  }, [id])

  async function handleStatusChange(status) {
    setError('')
    try {
      await invoicesApi.updateInvoice(id, { status })
      logInvoiceUpdated({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        reference: invoice?.reference ?? id,
        detail: `A changé le statut de la facture ${invoice?.reference ?? id} en « ${t(`status.${status}`)} »`,
      })
      await loadInvoice()
    } catch (err) {
      setError(extractErrorMessage(err, t('invoices.updateError')))
    }
  }

  async function handleAddLine(event) {
    event.preventDefault()
    setSavingLine(true)
    setError('')

    try {
      await invoicesApi.addInvoiceLine(id, {
        description: lineForm.description,
        quantity: Number(lineForm.quantity),
        unit_price_ht: Number(lineForm.unit_price_ht),
        tax_rate: Number(lineForm.tax_rate),
      })
      logInvoiceUpdated({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        reference: invoice?.reference ?? id,
        detail: `A ajouté une ligne à la facture ${invoice?.reference ?? id}`,
      })
      setLineForm(emptyLine)
      await loadInvoice()
    } catch (err) {
      setError(extractErrorMessage(err, t('invoices.lineSaveError')))
    } finally {
      setSavingLine(false)
    }
  }

  async function handleDeleteLine(lineId) {
    if (!window.confirm(t('invoices.deleteLineConfirm'))) {
      return
    }

    try {
      await invoicesApi.deleteInvoiceLine(lineId)
      logInvoiceUpdated({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        reference: invoice?.reference ?? id,
        detail: `A supprimé une ligne de la facture ${invoice?.reference ?? id}`,
      })
      await loadInvoice()
    } catch (err) {
      setError(extractErrorMessage(err, t('invoices.lineDeleteError')))
    }
  }

  async function handleRecordPayment(event) {
    event.preventDefault()
    setSavingPayment(true)
    setError('')

    try {
      await invoicesApi.recordPayment(id, {
        amount: Number(paymentForm.amount),
        paid_at: paymentForm.paid_at,
        method: paymentForm.method,
        reference: paymentForm.reference || null,
        notes: paymentForm.notes || null,
      })
      logPaymentRecorded({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        reference: invoice?.reference ?? id,
        amountLabel: formatMoney(Number(paymentForm.amount), locale),
      })
      setPaymentForm({ ...emptyPayment, paid_at: new Date().toISOString().slice(0, 10) })
      await loadInvoice()
    } catch (err) {
      setError(extractErrorMessage(err, t('invoices.paymentError')))
    } finally {
      setSavingPayment(false)
    }
  }

  async function handleDeletePayment(paymentId) {
    if (!window.confirm(t('invoices.deletePaymentConfirm'))) {
      return
    }

    try {
      const payment = payments.find((item) => item.id === paymentId)
      await invoicesApi.deletePayment(paymentId)
      logPaymentDeleted({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        reference: invoice?.reference ?? id,
        amountLabel: formatMoney(payment?.amount ?? 0, locale),
      })
      await loadInvoice()
    } catch (err) {
      setError(extractErrorMessage(err, t('invoices.paymentDeleteError')))
    }
  }

  if (loading) {
    return <p>{t('common.loading')}</p>
  }

  if (!invoice) {
    return <p className="error">{t('invoices.notFound')}</p>
  }

  return (
    <div className="list-page">
      <p className="breadcrumb">
        <Link to="/invoices">{t('invoices.title')}</Link> / {invoice.reference}
      </p>

      <header className="page-header">
        <div>
          <h1>{invoice.reference}</h1>
          <div className="inline-meta">
            <StatusBadge status={invoice.status} />
            <span>{invoice.client?.name}</span>
            {invoice.quote ? (
              <Link to={`/quotes/${invoice.quote.id}`}>
                {t('invoices.fromQuote', { reference: invoice.quote.reference })}
              </Link>
            ) : null}
            {invoice.project ? (
              <Link to={`/projects/${invoice.project.id}`}>{invoice.project.title}</Link>
            ) : null}
          </div>
        </div>
        <div className="actions">
          {hasPermission('invoice.manage') && invoice.status === 'draft' && lines.length > 0 ? (
            <button type="button" onClick={() => handleStatusChange('sent')}>
              {t('invoices.markSent')}
            </button>
          ) : null}
          {hasPermission('invoice.manage') && !['paid', 'cancelled'].includes(invoice.status) ? (
            <button type="button" className="ghost danger" onClick={() => handleStatusChange('cancelled')}>
              {t('invoices.markCancelled')}
            </button>
          ) : null}
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="card summary-card">
        <div className="summary-grid">
          <div>
            <span className="summary-label">{t('invoices.issuedAt')}</span>
            <strong>{invoice.issued_at ?? '—'}</strong>
          </div>
          <div>
            <span className="summary-label">{t('invoices.dueDate')}</span>
            <strong>{invoice.due_date ?? '—'}</strong>
          </div>
          <div>
            <span className="summary-label">{t('invoices.totalTtc')}</span>
            <strong>{formatMoney(invoice.total_ttc, locale)}</strong>
          </div>
          <div>
            <span className="summary-label">{t('invoices.amountPaid')}</span>
            <strong>{formatMoney(invoice.amount_paid, locale)}</strong>
          </div>
          <div>
            <span className="summary-label">{t('invoices.balanceDue')}</span>
            <strong>{formatMoney(invoice.balance_due, locale)}</strong>
          </div>
        </div>
        {invoice.notes ? <p className="hint">{invoice.notes}</p> : null}
      </div>

      <h2>{t('invoices.lines')}</h2>

      {canEditLines ? (
        <form className="inline-form line-form" onSubmit={handleAddLine}>
          <label>
            {t('invoices.lineDescription')}
            <input
              value={lineForm.description}
              onChange={(event) => setLineForm({ ...lineForm, description: event.target.value })}
              required
            />
          </label>
          <label>
            {t('invoices.quantity')}
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
            {t('invoices.unitPriceHt')}
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
            {t('invoices.taxRate')}
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
            {savingLine ? t('common.saving') : t('invoices.addLine')}
          </button>
        </form>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('invoices.lineDescription')}</th>
              <th>{t('invoices.quantity')}</th>
              <th>{t('invoices.unitPriceHt')}</th>
              <th>{t('invoices.taxRate')}</th>
              <th>{t('invoices.lineTotalTtc')}</th>
              {canEditLines ? <th>{t('common.actions')}</th> : null}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={canEditLines ? 6 : 5}>{t('invoices.noLines')}</td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{formatMoney(line.unit_price_ht, locale)}</td>
                  <td>{line.tax_rate}%</td>
                  <td>{formatMoney(line.line_total_ttc, locale)}</td>
                  {canEditLines ? (
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

      <PermissionGate permission="payment.record">
        <h2>{t('invoices.payments')}</h2>

        {canRecordPayment ? (
          <form className="inline-form line-form" onSubmit={handleRecordPayment}>
            <label>
              {t('invoices.paymentAmount')}
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={invoice.balance_due}
                value={paymentForm.amount}
                onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })}
                required
              />
            </label>
            <label>
              {t('invoices.paymentDate')}
              <input
                type="date"
                value={paymentForm.paid_at}
                onChange={(event) => setPaymentForm({ ...paymentForm, paid_at: event.target.value })}
                required
              />
            </label>
            <label>
              {t('invoices.paymentMethod')}
              <CutSelect
                className="w-full"
                value={paymentForm.method}
                onChange={(method) => setPaymentForm({ ...paymentForm, method })}
                options={[
                  { value: 'bank_transfer', label: t('invoices.methods.bank_transfer') },
                  { value: 'cash', label: t('invoices.methods.cash') },
                  { value: 'check', label: t('invoices.methods.check') },
                  { value: 'card', label: t('invoices.methods.card') },
                  { value: 'other', label: t('invoices.methods.other') },
                ]}
              />
            </label>
            <label>
              {t('invoices.paymentReference')}
              <input
                value={paymentForm.reference}
                onChange={(event) => setPaymentForm({ ...paymentForm, reference: event.target.value })}
              />
            </label>
            <button type="submit" disabled={savingPayment}>
              {savingPayment ? t('common.saving') : t('invoices.recordPayment')}
            </button>
          </form>
        ) : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('invoices.paymentDate')}</th>
                <th>{t('invoices.paymentAmount')}</th>
                <th>{t('invoices.paymentMethod')}</th>
                <th>{t('invoices.paymentReference')}</th>
                {canRecordPayment ? <th>{t('common.actions')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={canRecordPayment ? 5 : 4}>{t('invoices.noPayments')}</td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.paid_at}</td>
                    <td>{formatMoney(payment.amount, locale)}</td>
                    <td>{t(`invoices.methods.${payment.method}`)}</td>
                    <td>{payment.reference ?? '—'}</td>
                    {canRecordPayment ? (
                      <td>
                        <button type="button" className="ghost danger" onClick={() => handleDeletePayment(payment.id)}>
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
      </PermissionGate>
    </div>
  )
}
