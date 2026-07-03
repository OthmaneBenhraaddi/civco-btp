import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as messagingApi from '../../api/messaging'
import { BENTO_CARD_CLASS, PAGE_SUBTITLE_CLASS, PAGE_TITLE_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { LIVE_SYNC_INTERVAL_MS, useAutoRefresh } from '../../hooks/useAutoRefresh'
import { useMessagingPresence } from '../../hooks/useMessagingPresence'
import { useTranslation } from '../../i18n/LanguageContext'
import AdminClientThreadNav from './components/AdminClientThreadNav'
import PortalChatWindow from './components/PortalChatWindow'
import { buildThreadKey, formatProjectThreadLabel, parseThreadKey } from './threadKeys'

export default function AdminMessagingWorkspace() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const [clientGroups, setClientGroups] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedClientUserId, setSelectedClientUserId] = useState(null)
  const [selectedThreadKey, setSelectedThreadKey] = useState(buildThreadKey(null))
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const { projectId } = useMemo(
    () => parseThreadKey(selectedThreadKey),
    [selectedThreadKey],
  )

  useMessagingPresence({
    enabled: Boolean(selectedClientUserId),
    projectId,
    clientUserId: selectedClientUserId,
  })

  useEffect(() => {
    const clientParam = searchParams.get('client')
    const threadParam = searchParams.get('thread')

    if (clientParam) {
      const clientId = Number(clientParam)
      if (Number.isFinite(clientId)) {
        setSelectedClientUserId(clientId)
      }
    }

    if (threadParam) {
      setSelectedThreadKey(threadParam)
    }
  }, [searchParams])

  const selectedGroup = useMemo(
    () => clientGroups.find((group) => group.client_user_id === selectedClientUserId) ?? null,
    [clientGroups, selectedClientUserId],
  )

  const selectedThread = useMemo(() => {
    if (!selectedGroup?.threads) {
      return null
    }

    return selectedGroup.threads.find((thread) => buildThreadKey(thread.project_id) === selectedThreadKey) ?? null
  }, [selectedGroup, selectedThreadKey])

  const threadTitle = useMemo(() => {
    if (!selectedGroup) {
      return null
    }

    if (projectId == null) {
      return `${selectedGroup.client_name} — ${t('messaging.threadGeneral')}`
    }

    return `${selectedGroup.client_name} — ${formatProjectThreadLabel(selectedThread, t)}`
  }, [projectId, selectedGroup, selectedThread, t])

  const threadSubtitle = useMemo(() => {
    if (!selectedGroup) {
      return null
    }

    return projectId == null
      ? t('messaging.threadGeneralSubtitle')
      : t('messaging.threadProjectSubtitle')
  }, [projectId, selectedGroup, t])

  const loadGroups = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadingGroups(true)
      setError('')
    }

    try {
      const data = await messagingApi.fetchMessagingThreads()
      setClientGroups(data)

      setSelectedClientUserId((current) => {
        if (current && data.some((group) => group.client_user_id === current)) {
          return current
        }

        return data[0]?.client_user_id ?? null
      })
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, t('messaging.loadError')))
      }
    } finally {
      if (!silent) {
        setLoadingGroups(false)
      }
    }
  }, [t])

  const loadMessages = useCallback(async (clientUserId, nextProjectId, { silent = false } = {}) => {
    if (!clientUserId) {
      setMessages([])
      return
    }

    if (!silent) {
      setLoadingMessages(true)
    }

    try {
      const data = await messagingApi.fetchMessagingThread(clientUserId, nextProjectId)
      setMessages(data)

      if (!silent) {
        setClientGroups((current) => current.map((group) => {
          if (group.client_user_id !== clientUserId) {
            return group
          }

          const threads = (group.threads ?? []).map((thread) => {
            const matches = nextProjectId == null
              ? thread.project_id == null
              : thread.project_id === nextProjectId

            return matches ? { ...thread, unread_count: 0 } : thread
          })

          return {
            ...group,
            threads,
            unread_count: threads.reduce((sum, thread) => sum + (thread.unread_count ?? 0), 0),
          }
        }))
      }
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, t('messaging.loadError')))
      }
    } finally {
      if (!silent) {
        setLoadingMessages(false)
      }
    }
  }, [t])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    if (selectedClientUserId) {
      loadMessages(selectedClientUserId, projectId)
    } else {
      setMessages([])
    }
  }, [selectedClientUserId, projectId, loadMessages])

  useAutoRefresh(() => {
    loadGroups({ silent: true })
    if (selectedClientUserId) {
      loadMessages(selectedClientUserId, projectId, { silent: true })
    }
  }, LIVE_SYNC_INTERVAL_MS)

  function handleSelectThread(clientUserId, threadKey) {
    setSelectedClientUserId(clientUserId)
    setSelectedThreadKey(threadKey)
  }

  async function handleSend(messageText) {
    if (!selectedClientUserId) {
      return
    }

    setSending(true)

    try {
      const message = await messagingApi.sendMessagingMessage(
        selectedClientUserId,
        messageText,
        projectId,
      )
      setMessages((current) => [...current, message])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="list-page flex h-full min-h-0 flex-col space-y-6">
      <header className="page-header shrink-0">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>{t('messaging.adminTitle')}</h1>
          <p className={PAGE_SUBTITLE_CLASS}>{t('messaging.adminSubtitle')}</p>
        </div>
      </header>

      {error ? (
        <div className="shrink-0 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <div className={`${BENTO_CARD_CLASS} grid min-h-[520px] flex-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]`}>
        <aside className="border-b border-white/[0.06] lg:border-b-0 lg:border-r">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <h2 className="text-sm font-semibold text-white">{t('messaging.clientsTitle')}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{t('messaging.clientsSubtitle')}</p>
          </div>
          <AdminClientThreadNav
            clientGroups={clientGroups}
            selectedClientUserId={selectedClientUserId}
            selectedThreadKey={selectedThreadKey}
            loading={loadingGroups}
            onSelectThread={handleSelectThread}
            t={t}
          />
        </aside>

        <section className="min-h-[420px]">
          <PortalChatWindow
            threadTitle={threadTitle}
            threadSubtitle={threadSubtitle}
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
