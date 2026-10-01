import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as cmsTicketsApi from '../../api/superAdminTickets'
import CutFrame from '../../components/prodigy/CutFrame'
import NeonButton from '../../components/prodigy/NeonButton'
import { useTranslation } from '../../i18n/LanguageContext'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { formatRelativeTime } from '../../utils/formatRelativeTime'
import { mapTicketMessage } from '../tickets/ticketsData'

export default function SuperAdminTicketDetailPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await cmsTicketsApi.fetchCmsTicket(id)
        if (cancelled) return
        setTicket(data)
        setMessages((data.messages ?? []).map((message) => mapTicketMessage(message, t)))
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err, t('tickets.notFound')))
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, t])

  async function handleSend(event) {
    event.preventDefault()
    const text = reply.trim()
    if (!text || ticket?.status === 'resolved') return

    setSending(true)
    setError('')
    try {
      const message = await cmsTicketsApi.replyToCmsTicket(id, text)
      setMessages((current) => [...current, mapTicketMessage(message, t)])
      setReply('')
      setTicket((current) => (current ? { ...current, status: 'awaiting_staff' } : current))
    } catch (err) {
      setError(extractErrorMessage(err, t('tickets.replyError')))
    } finally {
      setSending(false)
    }
  }

  async function handleClose() {
    try {
      const data = await cmsTicketsApi.closeCmsTicket(id)
      setTicket(data)
    } catch (err) {
      setError(extractErrorMessage(err, t('tickets.closeError')))
    }
  }

  if (!ticket) {
    return <p className="p-8 text-sm text-slate-400">{error || t('common.loading')}</p>
  }

  const closed = ticket.status === 'resolved'

  return (
    <div className="mx-auto max-w-[860px] px-4 py-8">
      <Link to="/super-admin/tickets" className="pg-back-link">{t('tickets.backToList')}</Link>
      <div className="mt-6">
        <h1 className="text-2xl font-extrabold text-white">{ticket.title}</h1>
        <span className="mt-2 inline-flex bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-xs font-bold">CMS SUPPORT / SUPERADMIN</span>
        <p className="mt-2 text-sm text-slate-400">
          {ticket.tenant?.name ?? '—'}
          <span className="mx-2">·</span>
          {ticket.target_admin?.full_name ?? t('superAdmin.tickets.allAdmins')}
        </p>
        {!closed ? (
          <button type="button" className="mt-3 text-sm text-slate-300 underline" onClick={handleClose}>
            {t('tickets.close')}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      <div className="mt-8 space-y-4">
        {messages.map((message) => (
          <CutFrame key={message.id} as="article" size="md" innerClassName="bg-[#0e131f] p-5">
            <p className="text-sm font-semibold text-white">
              {message.author}
              <span className="ml-2 text-[11px] uppercase tracking-wide text-slate-500">{message.role}</span>
            </p>
            <p className="text-xs text-slate-500">{formatRelativeTime(message.when)}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{message.body}</p>
          </CutFrame>
        ))}
      </div>
      {!closed ? (
        <form className="mt-5" onSubmit={handleSend}>
          <textarea
            className="min-h-28 w-full rounded-lg border border-white/10 bg-[#0e131f] p-4 text-sm text-slate-200"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder={t('tickets.replyPlaceholder')}
          />
          <div className="mt-3">
            <NeonButton type="submit" className={sending || !reply.trim() ? 'pointer-events-none opacity-45' : ''}>
              {sending ? t('tickets.sending') : t('tickets.sendReply')}
            </NeonButton>
          </div>
        </form>
      ) : null}
    </div>
  )
}
