import { useState } from 'react'
import Modal from '../../components/Modal'
import NeonButton from '../../components/prodigy/NeonButton'
import * as demoApi from '../../api/demo'
import { useTranslation } from '../../i18n/LanguageContext'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { LABEL_CLASS } from '../../theme/designTokens'

const EMPTY_FORM = {
  full_name: '',
  company_name: '',
  email: '',
  phone: '',
  message: '',
}

const INPUT_CLASS = [
  'login-input w-full text-sm text-white placeholder:text-slate-500',
  'transition-all duration-200',
  'focus:border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/15',
].join(' ')

export default function DemoRequestModal({ open, onClose }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleClose() {
    setForm(EMPTY_FORM)
    setError('')
    setSuccess(false)
    setSubmitting(false)
    onClose?.()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      await demoApi.submitDemoRequest({
        full_name: form.full_name.trim(),
        company_name: form.company_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        message: form.message.trim() || null,
      })
      setSuccess(true)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(extractErrorMessage(err, t('demo.requestError')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={t('demo.requestTitle')}
      open={open}
      onClose={handleClose}
      panelClassName="pg-shell max-w-lg"
    >
      {success ? (
        <div className="space-y-4">
          <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {t('demo.requestSuccess')}
          </p>
          <NeonButton type="button" className="w-full" onClick={handleClose}>
            {t('common.close')}
          </NeonButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-300">{t('demo.requestSubtitle')}</p>

          <label className="block">
            <span className={LABEL_CLASS}>{t('demo.requestFullName')}</span>
            <input
              className={INPUT_CLASS}
              value={form.full_name}
              onChange={(event) => updateField('full_name', event.target.value)}
              required
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>{t('demo.requestCompany')}</span>
            <input
              className={INPUT_CLASS}
              value={form.company_name}
              onChange={(event) => updateField('company_name', event.target.value)}
              required
              autoComplete="organization"
            />
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>{t('demo.requestEmail')}</span>
            <input
              type="email"
              className={INPUT_CLASS}
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>{t('demo.requestPhone')}</span>
            <input
              type="tel"
              className={INPUT_CLASS}
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              autoComplete="tel"
            />
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>{t('demo.requestMessage')}</span>
            <textarea
              className={`${INPUT_CLASS} min-h-[110px] resize-y`}
              value={form.message}
              onChange={(event) => updateField('message', event.target.value)}
              rows={4}
            />
          </label>

          {error ? (
            <p className="m-0 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <NeonButton type="submit" disabled={submitting} className="w-full">
            {submitting ? t('demo.requestSubmitting') : t('demo.requestSubmit')}
          </NeonButton>
        </form>
      )}
    </Modal>
  )
}
