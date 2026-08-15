import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/Modal'
import NeonButton from '../../components/prodigy/NeonButton'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { resolveRedirectPath } from '../../routes/routeAccess'

export default function DemoCodeModal({ open, onClose }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { redeemDemo } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) {
      setError(t('demo.codeRequired'))
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const context = await redeemDemo(trimmed)
      onClose?.()
      navigate(resolveRedirectPath(context), { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, t('demo.invalidCode')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={t('demo.modalTitle')} open={open} onClose={onClose} panelClassName="pg-shell max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-300">{t('demo.modalSubtitle')}</p>
        <label className="grid gap-2 text-sm font-medium text-slate-300">
          {t('demo.codeLabel')}
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="DEMO-BTP-XXXX"
            autoComplete="off"
            className="login-input w-full text-sm uppercase tracking-[0.12em] text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500"
          />
        </label>
        {error ? (
          <p className="m-0 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        <NeonButton type="submit" disabled={submitting} className="w-full">
          {submitting ? t('demo.validating') : t('demo.validate')}
        </NeonButton>
      </form>
    </Modal>
  )
}
