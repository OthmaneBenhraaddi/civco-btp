import { useTranslation } from '../../i18n/LanguageContext'

export default function PrintCopyBadge({ variant }) {
  const { t } = useTranslation()
  const isOriginal = variant === 'original'

  return (
    <div
      className={[
        'print-copy-badge inline-flex items-center justify-center rounded-md border-2 px-4 py-1.5',
        'text-sm font-black uppercase tracking-[0.35em]',
        isOriginal
          ? 'border-emerald-600 text-emerald-700 print-copy-badge-original'
          : 'border-slate-500 text-slate-600 print-copy-badge-copy',
      ].join(' ')}
      aria-label={isOriginal ? t('print.original') : t('print.copy')}
    >
      {isOriginal ? t('print.original') : t('print.copy')}
    </div>
  )
}
