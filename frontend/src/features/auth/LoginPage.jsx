import { useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { getSafeReturnPath } from '../../utils/returnPath'
import CutFrame from '../../components/prodigy/CutFrame'
import NeonButton from '../../components/prodigy/NeonButton'

const INPUT_CLASS = [
  'login-input w-full pl-12 text-sm text-white placeholder:text-slate-500',
  'transition-all duration-200',
  'focus:border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/15',
].join(' ')

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login({ email, password })
      const returnFrom = location.state?.from
      const fallback = '/'
      const target = returnFrom && returnFrom !== '/' && returnFrom !== ''
        ? getSafeReturnPath(returnFrom, fallback)
        : fallback
      navigate(target, { replace: true })
    } catch (err) {
      const validationError = err.response?.data?.errors?.email?.[0]
      setError(validationError ?? extractErrorMessage(err, t('auth.invalidCredentials')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CutFrame className="login-card w-full" innerClassName="bg-[#0e121b]/95 p-8 sm:p-10" size="lg">
      <header className="mb-8">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--pg-accent)]">
          {t('auth.portalLabel')}
        </p>
        <h1 className="pg-section-title m-0 text-[1.85rem]">
          {t('auth.title')}
        </h1>
        <p className="mt-2 text-sm text-[var(--pg-text-muted)]">{t('auth.subtitle')}</p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="grid gap-2 text-sm font-medium text-slate-300">
          {t('auth.email')}
          <span className="login-input-wrap relative flex items-center">
            <Mail
              className="login-input-icon pointer-events-none absolute left-3 z-[2] h-4 w-4"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="vous@entreprise.ma"
              className={INPUT_CLASS}
            />
          </span>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-300">
          {t('auth.password')}
          <span className="login-input-wrap relative flex items-center">
            <Lock
              className="login-input-icon pointer-events-none absolute left-3 z-[2] h-4 w-4"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={INPUT_CLASS}
            />
          </span>
        </label>

        <div
          className={[
            'grid min-h-[2.75rem] items-center rounded-lg px-3 py-2.5 text-sm transition-colors',
            error
              ? 'border border-red-500/25 bg-red-500/10 text-red-300'
              : 'border border-transparent bg-transparent text-transparent',
          ].join(' ')}
          role={error ? 'alert' : undefined}
          aria-live="polite"
          aria-hidden={!error}
        >
          {error || '\u00a0'}
        </div>

        <NeonButton type="submit" disabled={submitting} className="mt-1 w-full">
          {submitting ? t('auth.signingIn') : t('auth.signIn')}
        </NeonButton>
      </form>
    </CutFrame>
  )
}
