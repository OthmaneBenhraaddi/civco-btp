import { useCallback, useEffect, useMemo, useState } from 'react'
import { BENTO_CARD_CLASS, PAGE_SUBTITLE_CLASS, PAGE_TITLE_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { LIVE_SYNC_INTERVAL_MS, useAutoRefresh } from '../../hooks/useAutoRefresh'
import { useTranslation } from '../../i18n/LanguageContext'
import PortalChatWindow from './components/PortalChatWindow'
import PortalContactList from './components/PortalContactList'

export default function MessagingWorkspace({
  titleKey,
  subtitleKey,
  contactsTitleKey,
  contactsSubtitleKey,
  emptyContactsKey,
  loadErrorKey,
  fetchContacts,
  fetchThread,
  sendMessage,
}) {
  const { t } = useTranslation()

  const [contacts, setContacts] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedContactId, setSelectedContactId] = useState(null)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId],
  )

  const loadContacts = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadingContacts(true)
      setError('')
    }

    try {
      const data = await fetchContacts()
      setContacts(data)
      setSelectedContactId((current) => {
        if (current && data.some((contact) => contact.id === current)) {
          return current
        }

        return data[0]?.id ?? null
      })
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, t(loadErrorKey)))
      }
    } finally {
      if (!silent) {
        setLoadingContacts(false)
      }
    }
  }, [fetchContacts, loadErrorKey, t])

  const loadMessages = useCallback(async (contactId, { silent = false } = {}) => {
    if (!contactId) {
      setMessages([])
      return
    }

    if (!silent) {
      setLoadingMessages(true)
    }

    try {
      const data = await fetchThread(contactId)
      setMessages(data)
      if (!silent) {
        setContacts((current) => current.map((contact) => (
          contact.id === contactId
            ? { ...contact, unread_count: 0 }
            : contact
        )))
      }
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, t(loadErrorKey)))
      }
    } finally {
      if (!silent) {
        setLoadingMessages(false)
      }
    }
  }, [fetchThread, loadErrorKey, t])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  useEffect(() => {
    if (selectedContactId) {
      loadMessages(selectedContactId)
    } else {
      setMessages([])
    }
  }, [selectedContactId, loadMessages])

  useAutoRefresh(() => {
    loadContacts({ silent: true })
    if (selectedContactId) {
      loadMessages(selectedContactId, { silent: true })
    }
  }, LIVE_SYNC_INTERVAL_MS)

  async function handleSend(messageText) {
    if (!selectedContactId) {
      return
    }

    setSending(true)

    try {
      const message = await sendMessage(selectedContactId, messageText)
      setMessages((current) => [...current, message])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="list-page flex h-full min-h-0 flex-col space-y-6">
      <header className="page-header shrink-0">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>{t(titleKey)}</h1>
          <p className={PAGE_SUBTITLE_CLASS}>{t(subtitleKey)}</p>
        </div>
      </header>

      {error ? (
        <div className="shrink-0 border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <div className={`${BENTO_CARD_CLASS} grid min-h-[520px] flex-1 overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)]`}>
        <aside className="border-b border-white/[0.06] lg:border-b-0 lg:border-r">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">{t(contactsTitleKey)}</h2>
            <p className="mt-0.5 text-xs text-[var(--pg-text-dim)]">{t(contactsSubtitleKey)}</p>
          </div>
          <PortalContactList
            contacts={contacts}
            selectedContactId={selectedContactId}
            loading={loadingContacts}
            onSelect={setSelectedContactId}
            t={t}
            emptyMessage={t(emptyContactsKey)}
          />
        </aside>

        <section className="min-h-[420px]">
          <PortalChatWindow
            contact={selectedContact}
            messages={messages}
            loading={loadingMessages}
            sending={sending}
            onSend={handleSend}
          />
        </section>
      </div>
    </div>
  )
}
