import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as portalTicketsApi from '../../api/clientPortalTickets'
import * as ticketsApi from '../../api/tickets'
import CutFrame from '../../components/prodigy/CutFrame'
import NeonButton from '../../components/prodigy/NeonButton'
import Reveal from '../../components/prodigy/Reveal'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { useActionToast } from '../../hooks/useActionToast'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { formatRelativeTime } from '../../utils/formatRelativeTime'
import {
  mapTicketListItem,
  mapTicketMessage,
  nextStatusAfterReply,
  priorityLabel,
  statusClassName,
  statusLabel,
} from './ticketsData'
import { useTicketsBasePath } from './useTicketsBasePath'

export default function TicketDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const basePath = useTicketsBasePath()
  const { isClientPortalUser, hasPermission } = useAuth()
  const { toastSuccess, toastUpdated, toastError } = useActionToast()

  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)

  const canReply = isClientPortalUser || hasPermission('ticket.reply')
  const canClose = !isClientPortalUser && hasPermission('ticket.close')
  const isClosed = ticket?.status === 'resolved'

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = isClientPortalUser
          ? await portalTicketsApi.fetchPortalTicket(id)
          : await ticketsApi.fetchTicket(id)
        if (cancelled) return
        setTicket(mapTicketListItem(data))
        setMessages((data.messages ?? []).map((message) => mapTicketMessage(message, t)))
      } catch (err) {
        if (!cancelled) {
          setTicket(null)
          setMessages([])
          setError(extractErrorMessage(err, t('tickets.notFound')))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, isClientPortalUser, t])

  async function handleSend(event) {
    event.preventDefault()
    const text = reply.trim()
    if (!text || !canReply || isClosed) return

    setSending(true)
    setError('')
    try {
      const message = isClientPortalUser
        ? await portalTicketsApi.replyToPortalTicket(id, text)
        : await ticketsApi.replyToTicket(id, text)
      setMessages((current) => [...current, mapTicketMessage(message, t)])
      setReply('')
      toastSuccess(t('toast.messages.ticketReplied'))
      setTicket((current) =>
        current
          ? { ...current, status: nextStatusAfterReply(isClientPortalUser) }
          : current,
      )
    } catch (err) {
      const message = extractErrorMessage(err, t('tickets.replyError'))
      setError(message)
      toastError(message)
    } finally {
      setSending(false)
    }
  }

  async function handleClose() {
    if (!canClose || isClosed) return
    setClosing(true)
    setError('')
    try {
      const data = await ticketsApi.closeTicket(id)
      setTicket(mapTicketListItem(data))
      if (data.messages) {
        setMessages(data.messages.map((message) => mapTicketMessage(message, t)))
      }
      toastUpdated(t('toast.messages.ticketClosed'))
    } catch (err) {
      const message = extractErrorMessage(err, t('tickets.closeError'))
      setError(message)
      toastError(message)
    } finally {
      setClosing(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[860px] px-4 py-10 sm:px-6">
        <p className="text-sm text-[var(--pg-text-muted)]">{t('common.loading')}</p>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-[860px] px-4 py-10 sm:px-6">
        <Link to={basePath} className="pg-back-link">
          <IconChevronLeft className="h-3.5 w-3.5" />
          {t('tickets.backToList')}
        </Link>
        <p className="mt-8 text-sm text-[var(--pg-text-muted)]">{error || t('tickets.notFound')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-full pb-12">
      <div className="mx-auto max-w-[860px] px-4 py-8 sm:px-6 sm:py-10">
        <Reveal>
          <Link to={basePath} className="pg-back-link">
            <IconChevronLeft className="h-3.5 w-3.5" />
            {t('tickets.backToList')}
          </Link>
        </Reveal>

        <Reveal delay={0.05} className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--pg-font-display)] text-[clamp(1.45rem,2.6vw,2rem)] font-extrabold leading-tight tracking-tight text-white">
              {ticket.title}
            </h1>
            <p className="mt-2 text-sm text-[var(--pg-text-muted)]">
              <span className="font-mono text-[var(--pg-text-dim)]">#{ticket.id}</span>
              <span className="mx-2 text-white/15">·</span>
              {ticket.client}
              {ticket.project ? (
                <>
                  <span className="mx-2 text-white/15">·</span>
                  {ticket.project}
                </>
              ) : null}
              <span className="mx-2 text-white/15">·</span>
              {priorityLabel(ticket.priority, t)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <span className={`pg-status-fill ${statusClassName(ticket.status, isClientPortalUser)} shrink-0`}>
              {statusLabel(ticket.status, t, { isClientPortalUser })}
            </span>
            {canClose && !isClosed ? (
              <NeonButton
                type="button"
                variant="ghost"
                onClick={handleClose}
                className={closing ? 'pointer-events-none opacity-45' : ''}
              >
                {closing ? t('tickets.closing') : t('tickets.close')}
              </NeonButton>
            ) : null}
          </div>
        </Reveal>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <div className="mt-8 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.04, duration: 0.35 }}
            >
              <CutFrame as="article" size="md" innerClassName="bg-[#0e131f] p-5 sm:p-6">
                <header className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1c2433] text-xs font-bold text-white ring-1 ring-white/10">
                    {message.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {message.author}
                      <span className="ml-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--pg-text-dim)]">
                        {message.role}
                      </span>
                    </p>
                    <p className="text-xs text-[var(--pg-text-dim)]">{formatRelativeTime(message.when)}</p>
                  </div>
                </header>

                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-300">
                  {message.body}
                </p>
              </CutFrame>
            </motion.div>
          ))}
        </div>

        {isClosed ? (
          <Reveal delay={0.12} className="mt-5">
            <div className="pg-cut-shell pg-cut-shell--md">
              <div className="pg-cut-shell__inner bg-[#0e131f] px-5 py-4 text-sm text-[var(--pg-text-muted)]">
                {t('tickets.closedNotice')}
              </div>
            </div>
          </Reveal>
        ) : canReply ? (
          <Reveal delay={0.12} className="mt-5">
            <CutFrame
              as="form"
              size="md"
              onSubmit={handleSend}
              className="block"
              innerClassName="overflow-hidden bg-[#0e131f]"
            >
              <textarea
                rows={6}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder={t('tickets.replyPlaceholder')}
                className="min-h-[140px] w-full resize-y border-0 bg-transparent px-4 py-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-0"
              />

              <div className="flex items-center justify-end border-t border-white/[0.05] px-4 py-3">
                <NeonButton
                  type="submit"
                  className={sending || !reply.trim() ? 'pointer-events-none opacity-45' : ''}
                >
                  <IconSend className="h-3.5 w-3.5" />
                  {sending ? t('tickets.sending') : t('tickets.sendReply')}
                </NeonButton>
              </div>
            </CutFrame>
          </Reveal>
        ) : null}
      </div>
    </div>
  )
}

function IconChevronLeft({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12.5 4.5L7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconSend({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 12l16-7-7 16-2.5-6.5L4 12z" strokeLinejoin="round" />
    </svg>
  )
}
