import { useState } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import { isPlatformSuperAdmin } from '../../utils/authIdentity'
import { useAuth } from '../../context/AuthContext'

function PasswordReveal({ password, canReveal, hasStored, t }) {
  const [visible, setVisible] = useState(false)

  if (!canReveal) {
    return (
      <span className="text-xs text-slate-500">
        {hasStored ? t('clients.portal.passwordRestricted') : '—'}
      </span>
    )
  }

  if (!password) {
    return <span className="text-slate-500">—</span>
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-amber-300">
        {visible ? password : '••••••••'}
      </span>
      <button
        type="button"
        className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 hover:bg-white/5"
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? t('team.hidePassword') : t('team.showPassword')}
      </button>
    </div>
  )
}

export default function ClientPortalPanel({
  portalUser,
  canManage,
  toggling,
  onToggle,
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const canRevealCredentials = isPlatformSuperAdmin(user)
  const isActive = portalUser?.is_active ?? false

  return (
    <div className="rounded-xl border border-slate-800/60 bg-[#0a0b0d]/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {t('clients.portal.title')}
          </p>
          <p className="mt-1 text-xs text-slate-400">{t('clients.portal.subtitle')}</p>
        </div>
        {canManage ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <span>{isActive ? t('clients.portal.active') : t('clients.portal.inactive')}</span>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              disabled={toggling}
              onClick={() => onToggle(!isActive)}
              className={[
                'relative h-6 w-11 rounded-full transition-colors disabled:opacity-60',
                isActive ? 'bg-emerald-500' : 'bg-slate-600',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                  isActive ? 'translate-x-5' : 'translate-x-0.5',
                ].join(' ')}
              />
            </button>
          </label>
        ) : null}
      </div>

      {portalUser ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-[#111214] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t('clients.portal.loginEmail')}
            </p>
            <p className="mt-1 text-sm text-slate-200">{portalUser.email}</p>
          </div>
          <div className="rounded-lg bg-[#111214] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t('clients.portal.password')}
            </p>
            <div className="mt-1">
              <PasswordReveal
                password={portalUser.stored_password}
                hasStored={portalUser.has_stored_credentials}
                canReveal={canRevealCredentials}
                t={t}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">{t('clients.portal.notProvisioned')}</p>
      )}
    </div>
  )
}
