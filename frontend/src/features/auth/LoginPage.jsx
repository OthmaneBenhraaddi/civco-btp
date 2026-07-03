import { useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { resolveRedirectPath } from '../../routes/routeAccess'

const DEMO_ACCOUNTS = {
  admin: { email: 'admin@btpdemo.fr', password: 'password' },
  client: { email: 'client.portal@civco-btp.ma', password: 'password' },
  yassine: { email: 'yassine.mansouri@civco-btp.ma', password: 'password' },
  amine: { email: 'amine.alami@civco-btp.ma', password: 'password' },
}

const INPUT_CLASS = [
  'login-input w-full text-sm text-white placeholder:text-slate-500',
  'transition-all duration-200',
  'focus:border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/15',
].join(' ')

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeDemo, setActiveDemo] = useState(null)

  function fillDemoCredentials(type) {
    const account = DEMO_ACCOUNTS[type]
    if (!account) return

    setEmail(account.email)
    setPassword(account.password)
    setActiveDemo(type)
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const context = await login({ email, password })
      navigate(resolveRedirectPath(context), { replace: true })
    } catch (err) {
      const validationError = err.response?.data?.errors?.email?.[0]
      setError(validationError ?? extractErrorMessage(err, t('auth.invalidCredentials')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-card rounded-2xl border border-white/[0.06] bg-[#121316]/90 p-8 shadow-2xl shadow-black/50 backdrop-blur-md sm:p-10">
      <header className="mb-8">
        <h1 className="m-0 text-2xl font-bold tracking-tight text-white">
          {t('auth.title')}
        </h1>
        <p className="mt-2 text-sm text-slate-400">{t('auth.subtitle')}</p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fillDemoCredentials('admin')}
          className={[
            'login-demo-badge rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200',
            activeDemo === 'admin'
              ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
              : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/15 hover:bg-white/[0.06] hover:text-slate-200',
          ].join(' ')}
        >
          {t('auth.demoAdmin')}
        </button>
        <button
          type="button"
          onClick={() => fillDemoCredentials('client')}
          className={[
            'login-demo-badge rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200',
            activeDemo === 'client'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/15 hover:bg-white/[0.06] hover:text-slate-200',
          ].join(' ')}
        >
          {t('auth.demoClient')}
        </button>
        <button
          type="button"
          onClick={() => fillDemoCredentials('yassine')}
          className={[
            'login-demo-badge rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200',
            activeDemo === 'yassine'
              ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
              : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/15 hover:bg-white/[0.06] hover:text-slate-200',
          ].join(' ')}
        >
          {t('auth.demoYassine')}
        </button>
        <button
          type="button"
          onClick={() => fillDemoCredentials('amine')}
          className={[
            'login-demo-badge rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200',
            activeDemo === 'amine'
              ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
              : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/15 hover:bg-white/[0.06] hover:text-slate-200',
          ].join(' ')}
        >
          {t('auth.demoAmine')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="grid gap-2 text-sm font-medium text-slate-300">
          {t('auth.email')}
          <span className="login-input-wrap">
            <Mail
              className="login-input-icon h-4 w-4"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setActiveDemo(null)
              }}
              required
              autoComplete="email"
              placeholder="admin@btpdemo.fr"
              className={INPUT_CLASS}
            />
          </span>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-300">
          {t('auth.password')}
          <span className="login-input-wrap">
            <Lock
              className="login-input-icon h-4 w-4"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setActiveDemo(null)
              }}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={INPUT_CLASS}
            />
          </span>
        </label>

        {error ? (
          <p className="m-0 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="login-submit-btn mt-1 w-full rounded-lg bg-white py-3 text-sm font-medium text-black transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>
    </div>
  )
}
