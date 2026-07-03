import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as clientPortalMessagesApi from '../../api/clientPortalMessages'
import { BENTO_CARD_CLASS, PAGE_SUBTITLE_CLASS, PAGE_TITLE_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { LIVE_SYNC_INTERVAL_MS, useAutoRefresh } from '../../hooks/useAutoRefresh'
import { useMessagingPresence } from '../../hooks/useMessagingPresence'
import { useTranslation } from '../../i18n/LanguageContext'
import ClientThreadNav from './components/ClientThreadNav'
import PortalChatWindow from './components/PortalChatWindow'
import { buildThreadKey, formatProjectThreadLabel, parseThreadKey } from './threadKeys'

export default function ClientMessagingWorkspace() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const [threads, setThreads] = useState(null)
  const [messages, setMessages] = useState([])
  const [selectedThreadKey, setSelectedThreadKey] = useState(buildThreadKey(null))
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const { projectId } = useMemo(
    () => parseThreadKey(selectedThreadKey),
    [selectedThreadKey],
  )

  useMessagingPresence({
    enabled: true,
    projectId,
    isClientPortal: true,
  })

  useEffect(() => {
    const threadParam = searchParams.get('thread')

    if (threadParam) {
      setSelectedThreadKey(threadParam)
    }
  }, [searchParams])

  const selectedProject = useMemo(() => {
    if (projectId == null || !threads?.projects) {
      return null
    }

    return threads.projects.find((project) => project.project_id === projectId) ?? null
  }, [projectId, threads])

  const threadTitle = useMemo(() => {
    if (projectId == null) {
      return t('clientPortal.threadGeneral')
    }

    return formatProjectThreadLabel(selectedProject, t)
  }, [projectId, selectedProject, t])

  const threadSubtitle = useMemo(() => {
    if (projectId == null) {
      return t('clientPortal.threadGeneralSubtitle')
    }

    return t('clientPortal.threadProjectSubtitle')
  }, [projectId, t])

  const loadThreads = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadingThreads(true)
      setError('')
    }

    try {
      const data = await clientPortalMessagesApi.fetchMessageThreads()
      setThreads(data)
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, t('clientPortal.discussionsLoadError')))
      }
    } finally {
      if (!silent) {
        setLoadingThreads(false)
      }
    }
  }, [t])

  const loadMessages = useCallback(async (nextProjectId, { silent = false } = {}) => {
    if (!silent) {
      setLoadingMessages(true)
    }

    try {
      const data = await clientPortalMessagesApi.fetchMessageThread(nextProjectId)
      setMessages(data)

      if (!silent) {
        setThreads((current) => {
          if (!current) {
            return current
          }

          if (nextProjectId == null) {
            return {
              ...current,
              general: { ...current.general, unread_count: 0 },
            }
          }

          return {
            ...current,
            projects: (current.projects ?? []).map((project) => (
              project.project_id === nextProjectId
                ? { ...project, unread_count: 0 }
                : project
            )),
          }
        })
      }
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, t('clientPortal.discussionsLoadError')))
      }
    } finally {
      if (!silent) {
        setLoadingMessages(false)
      }
    }
  }, [t])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  useEffect(() => {
    loadMessages(projectId)
  }, [projectId, loadMessages])

  useAutoRefresh(() => {
    loadThreads({ silent: true })
    loadMessages(projectId, { silent: true })
  }, LIVE_SYNC_INTERVAL_MS)

  async function handleSend(messageText) {
    setSending(true)

    try {
      const message = await clientPortalMessagesApi.sendPortalMessage(messageText, projectId)
      setMessages((current) => [...current, message])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="list-page flex h-full min-h-0 flex-col space-y-6">
      <header className="page-header shrink-0">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>{t('clientPortal.discussionsPageTitle')}</h1>
          <p className={PAGE_SUBTITLE_CLASS}>{t('clientPortal.discussionsPageSubtitle')}</p>
        </div>
      </header>

      {error ? (
        <div className="shrink-0 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <div className={`${BENTO_CARD_CLASS} grid min-h-[520px] flex-1 overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)]`}>
        <aside className="border-b border-white/[0.06] lg:border-b-0 lg:border-r">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <h2 className="text-sm font-semibold text-white">{t('clientPortal.threadsTitle')}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{t('clientPortal.threadsSubtitle')}</p>
          </div>
          <ClientThreadNav
            threads={threads}
            selectedThreadKey={selectedThreadKey}
            loading={loadingThreads}
            onSelect={setSelectedThreadKey}
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
            emptyKey="clientPortal.noMessages"
            selectPromptKey="clientPortal.selectThread"
          />
        </section>
      </div>
    </div>
  )
}
