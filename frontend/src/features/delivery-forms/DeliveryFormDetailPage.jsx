import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as deliveryFormsApi from '../../api/deliveryForms'
import { extractErrorMessage, unwrapResource } from '../../utils/apiHelpers'

export default function DeliveryFormDetailPage() {
  const { id } = useParams()
  const { hasPermission } = useAuth()
  const { t } = useTranslation()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const lines = unwrapResource(form?.lines)
  const canEdit = form?.status === 'draft' && hasPermission('delivery_form.manage')

  async function loadForm() {
    setLoading(true)
    setError('')

    try {
      const data = await deliveryFormsApi.fetchDeliveryForm(id)
      setForm(data.data ?? data)
    } catch (err) {
      setError(extractErrorMessage(err, t('deliveryForms.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForm()
  }, [id])

  async function handleStatusChange(status) {
    setError('')
    try {
      await deliveryFormsApi.updateDeliveryForm(id, { status })
      await loadForm()
    } catch (err) {
      setError(extractErrorMessage(err, t('deliveryForms.updateError')))
    }
  }

  if (loading) {
    return <p>{t('common.loading')}</p>
  }

  if (!form) {
    return <p className="error">{t('deliveryForms.notFound')}</p>
  }

  return (
    <div>
      <p className="breadcrumb">
        <Link to="/delivery-forms">{t('deliveryForms.title')}</Link> / {form.reference}
      </p>

      <header className="page-header">
        <div>
          <h1>{form.reference}</h1>
          <div className="inline-meta">
            <StatusBadge status={form.status} />
            <span>{form.client?.name}</span>
            {form.project ? (
              <Link to={`/projects/${form.project.id}`}>{form.project.title}</Link>
            ) : null}
            {form.quote ? (
              <Link to={`/quotes/${form.quote.id}`}>{form.quote.reference}</Link>
            ) : null}
          </div>
        </div>
        <div className="actions">
          {canEdit ? (
            <button type="button" className="ghost" onClick={() => handleStatusChange('signed')}>
              {t('deliveryForms.markSigned')}
            </button>
          ) : null}
          {form.invoice ? (
            <Link to={`/invoices/${form.invoice.id}`} className="btn-action">
              {t('deliveryForms.viewInvoice', { reference: form.invoice.reference })}
            </Link>
          ) : null}
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="card summary-card">
        <div className="summary-grid">
          <div>
            <span className="summary-label">{t('deliveryForms.deliveryDate')}</span>
            <strong>{form.delivery_date ?? '—'}</strong>
          </div>
          <div>
            <span className="summary-label">{t('deliveryForms.client')}</span>
            <strong>{form.client?.name ?? '—'}</strong>
          </div>
          <div>
            <span className="summary-label">{t('deliveryForms.project')}</span>
            <strong>{form.project?.title ?? '—'}</strong>
          </div>
        </div>
        {form.description ? <p className="hint">{form.description}</p> : null}
      </div>

      <h2>{t('deliveryForms.lines')}</h2>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('deliveryForms.lineDescription')}</th>
              <th>{t('deliveryForms.quantity')}</th>
              <th>{t('deliveryForms.phase')}</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={3}>{t('deliveryForms.noLines')}</td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{line.project_phase?.name ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
