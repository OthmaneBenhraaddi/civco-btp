import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import { extractErrorMessage } from '../../utils/apiHelpers'

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth()
  const { t } = useTranslation()
  const [email, setEmail] = useState('admin@btpdemo.fr')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login({ email, password })
    } catch (err) {
      const validationError = err.response?.data?.errors?.email?.[0]
      setError(validationError ?? extractErrorMessage(err, t('auth.invalidCredentials')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={[
        'w-full max-w-[420px] rounded-2xl border p-8 shadow-xl transition-colors duration-500',
        'border-gray-200 bg-white shadow-gray-200/50',
        'dark:border-gray-800 dark:bg-[#16171B] dark:shadow-black/40',
      ].join(' ')}
    >
      <div className="mb-4 flex justify-end">
        <LanguageSwitcher variant="auth" />
      </div>

      <h1 className="m-0 text-2xl font-semibold tracking-tight text-gray-900 dark:text-zinc-50">
        {t('auth.title')}
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">{t('auth.subtitle')}</p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium text-gray-700 dark:text-zinc-300">
          {t('auth.email')}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className={[
              'rounded-xl border px-3.5 py-2.5 text-sm transition-colors duration-300',
              'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400',
              'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
              'dark:border-gray-700 dark:bg-[#0D0E11] dark:text-zinc-100 dark:placeholder:text-zinc-500',
              'dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20',
            ].join(' ')}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-gray-700 dark:text-zinc-300">
          {t('auth.password')}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            className={[
              'rounded-xl border px-3.5 py-2.5 text-sm transition-colors duration-300',
              'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400',
              'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
              'dark:border-gray-700 dark:bg-[#0D0E11] dark:text-zinc-100 dark:placeholder:text-zinc-500',
              'dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20',
            ].join(' ')}
          />
        </label>

        {error ? (
          <p className="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className={[
            'mt-1 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white',
            'transition-all duration-300 hover:bg-indigo-500',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/40',
            'disabled:cursor-not-allowed disabled:opacity-70',
          ].join(' ')}
        >
          {submitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>
    </div>
  )
}
