import { useState } from 'react'
import { BENTO_CARD_CLASS, BTN_PRIMARY, FIELD_CLASS } from '../../../theme/designTokens'
import { formatRelativeTime } from '../../../utils/formatRelativeTime'
import { useTranslation } from '../../../i18n/LanguageContext'

export default function DiscussionBox({
  comments,
  loading,
  posting,
  onSubmit,
}) {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = content.trim()

    if (!trimmed) {
      setError(t('clientPortal.commentRequired'))
      return
    }

    setError('')

    try {
      await onSubmit(trimmed)
      setContent('')
    } catch {
      setError(t('clientPortal.commentError'))
    }
  }

  return (
    <section className={`${BENTO_CARD_CLASS} flex h-full flex-col p-6`}>
      <header className="mb-5">
        <h2 className="text-lg font-semibold text-white">{t('clientPortal.discussionTitle')}</h2>
        <p className="mt-1 text-sm text-slate-400">{t('clientPortal.discussionSubtitle')}</p>
      </header>

      <div className="mb-4 max-h-80 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-sm text-slate-500">{t('common.loading')}</p>
        ) : comments.length === 0 ? (
          <p className="pg-inner-tile px-4 py-8 text-center text-sm text-[var(--pg-text-dim)]">
            {t('clientPortal.noComments')}
          </p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className={`rounded-xl border px-4 py-3 ${
                comment.user?.is_client
                  ? 'ml-6 border-[rgba(34,197,94,0.25)] bg-[var(--pg-accent-dim)]'
                  : 'mr-6 pg-inner-tile'
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-white">
                  {comment.user?.full_name ?? t('clientPortal.unknownAuthor')}
                </span>
                <span className="text-[10px] text-slate-500">
                  {formatRelativeTime(comment.created_at)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {comment.content}
              </p>
            </article>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-auto space-y-3 border-t border-white/[0.06] pt-4">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          placeholder={t('clientPortal.commentPlaceholder')}
          className={`${FIELD_CLASS} resize-none`}
        />
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
        <button type="submit" disabled={posting} className={BTN_PRIMARY}>
          {posting ? t('common.saving') : t('clientPortal.sendComment')}
        </button>
      </form>
    </section>
  )
}
