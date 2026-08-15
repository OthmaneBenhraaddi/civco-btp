import { useEffect, useRef, useState } from 'react'
import { BTN_PRIMARY, FIELD_CLASS } from '../../../theme/designTokens'
import { formatRelativeTime } from '../../../utils/formatRelativeTime'
import { useTranslation } from '../../../i18n/LanguageContext'
import { useAuth } from '../../../context/AuthContext'

export default function PortalChatWindow({
  threadTitle,
  threadSubtitle,
  messages,
  loading,
  sending,
  onSend,
  emptyKey = 'messaging.noMessages',
  selectPromptKey = 'messaging.selectThread',
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const threadId = `${threadTitle ?? ''}:${threadSubtitle ?? ''}`

  useEffect(() => {
    setDraft('')
    setError('')
  }, [threadId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, threadId])

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = draft.trim()

    if (!trimmed) {
      setError(t('messaging.messageRequired'))
      return
    }

    setError('')

    try {
      await onSend(trimmed)
      setDraft('')
    } catch {
      setError(t('messaging.messageError'))
    }
  }

  if (!threadTitle) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-slate-400">{t(selectPromptKey)}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <header className="border-b border-white/[0.06] px-5 py-4">
        <p className="text-sm font-semibold text-white">{threadTitle}</p>
        {threadSubtitle ? (
          <p className="mt-0.5 text-xs text-slate-500">{threadSubtitle}</p>
        ) : null}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="text-sm text-slate-500">{t('common.loading')}</p>
        ) : messages.length === 0 ? (
          <p className="pg-inner-tile px-4 py-8 text-center text-sm text-[var(--pg-text-dim)]">
            {t(emptyKey)}
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === user?.id

            return (
              <article
                key={message.id}
                className={`max-w-[85%] border px-4 py-3 ${
                  isMine
                    ? 'ml-auto border-[rgba(34,197,94,0.25)] bg-[var(--pg-accent-dim)]'
                    : 'mr-auto pg-inner-tile'
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-white">
                    {message.sender?.full_name ?? t('messaging.unknownAuthor')}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatRelativeTime(message.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                  {message.message_text}
                </p>
              </article>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 border-t border-white/[0.06] px-5 py-4"
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder={t('messaging.messagePlaceholder')}
          className={`${FIELD_CLASS} resize-none`}
        />
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
        <button type="submit" disabled={sending} className={BTN_PRIMARY}>
          {sending ? t('common.saving') : t('messaging.sendMessage')}
        </button>
      </form>
    </div>
  )
}
