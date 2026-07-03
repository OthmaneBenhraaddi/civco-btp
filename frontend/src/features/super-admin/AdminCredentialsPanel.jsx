import { useState } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import * as superAdminApi from '../../api/superAdmin'
import { extractErrorMessage } from '../../utils/apiHelpers'

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/5"
      title={label}
    >
      {copied ? '✓' : label}
    </button>
  )
}

export default function AdminCredentialsPanel({ tenantId, admin, onCredentialsUpdated }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState(null)
  const [visible, setVisible] = useState(false)

  async function loadCredentials() {
    setLoading(true)
    setError('')

    try {
      const data = await superAdminApi.fetchAdminCredentials(tenantId, admin.id)
      setCredentials(data)
      setVisible(true)
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.credentials.loadError')))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    setResetting(true)
    setError('')

    try {
      const data = await superAdminApi.resetAdminPassword(tenantId, admin.id)
      setCredentials(data)
      setVisible(true)
      onCredentialsUpdated?.()
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.credentials.resetError')))
    } finally {
      setResetting(false)
    }
  }

  function handleToggle() {
    if (visible) {
      setVisible(false)
      return
    }

    if (credentials) {
      setVisible(true)
      return
    }

    loadCredentials()
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-500/15 disabled:opacity-60"
      >
        {loading
          ? t('common.loading')
          : visible
            ? t('superAdmin.credentials.hide')
            : t('superAdmin.credentials.view')}
      </button>

      {error ? <p className="text-xs text-red-300">{error}</p> : null}

      {visible ? (
        <div className="rounded-lg border border-white/[0.06] bg-[#0a0b0d]/60 p-3">
          <dl className="grid gap-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <dt className="text-slate-500">{t('superAdmin.adminEmail')}</dt>
                <dd className="font-mono text-slate-200">{credentials?.email ?? admin.email}</dd>
              </div>
              <CopyButton value={credentials?.email ?? admin.email} label={t('superAdmin.credentials.copy')} />
            </div>

            {credentials?.password ? (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <dt className="text-slate-500">{t('superAdmin.tempPassword')}</dt>
                  <dd className="font-mono text-amber-300">{credentials.password}</dd>
                </div>
                <CopyButton value={credentials.password} label={t('superAdmin.credentials.copy')} />
              </div>
            ) : (
              <div>
                <p className="text-slate-400">{t('superAdmin.credentials.unavailable')}</p>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetting}
                  className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-300 hover:bg-amber-500/15 disabled:opacity-60"
                >
                  {resetting ? t('superAdmin.credentials.resetting') : t('superAdmin.credentials.reset')}
                </button>
              </div>
            )}
          </dl>
        </div>
      ) : null}
    </div>
  )
}
