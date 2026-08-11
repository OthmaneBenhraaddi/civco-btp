import { useTranslation } from '../../../i18n/LanguageContext'

export default function ProvisionSuccessBanner({ result, variant = 'tenant' }) {
  const { t } = useTranslation()

  if (!result) {
    return null
  }

  const isAdmin = variant === 'admin'

  return (
    <div className="card mb-6 border border-emerald-500/30 bg-emerald-500/5 p-4">
      <h2 className="text-lg font-semibold text-emerald-300">
        {isAdmin ? t('superAdmin.addAdmin.createdTitle') : t('superAdmin.createdTitle')}
      </h2>
      <p className="mt-2 text-sm text-slate-300">
        {isAdmin
          ? t('superAdmin.addAdmin.createdHint', {
            name: result.admin?.full_name ?? result.admin?.email,
          })
          : t('superAdmin.createdHint', {
            name: result.tenant?.name,
            subdomain: result.tenant?.subdomain,
          })}
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">{t('superAdmin.adminEmail')}</dt>
          <dd className="font-mono text-sm text-white">{result.admin?.email}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">{t('superAdmin.tempPassword')}</dt>
          <dd className="font-mono text-sm text-amber-300">{result.temporary_password}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-slate-500">{t('superAdmin.loginUrl')}</dt>
          <dd className="text-sm">
            <a
              href={result.login_url}
              className="text-indigo-300 underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {result.login_url}
            </a>
          </dd>
          {!isAdmin ? (
            <p className="mt-2 text-xs text-slate-500">{t('superAdmin.loginUrlHint')}</p>
          ) : null}
        </div>
      </dl>
    </div>
  )
}
