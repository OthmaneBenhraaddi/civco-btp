import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import CutFrame from '../../components/prodigy/CutFrame'
import NeonButton from '../../components/prodigy/NeonButton'
import Reveal from '../../components/prodigy/Reveal'
import SiteFooter from '../../components/prodigy/SiteFooter'
import {
  getTicketById,
  getTicketThread,
  statusLabel,
} from './ticketsData'

export default function TicketDetailPage() {
  const { id } = useParams()
  const ticket = useMemo(() => getTicketById(id), [id])
  const seedThread = useMemo(() => getTicketThread(id), [id])
  const [messages, setMessages] = useState(seedThread.messages)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setMessages(seedThread.messages)
    setReply('')
  }, [seedThread])

  if (!ticket) {
    return (
      <div className="mx-auto max-w-[860px] px-4 py-10 sm:px-6">
        <Link to="/tickets" className="pg-back-link">
          <IconChevronLeft className="h-3.5 w-3.5" />
          Back to tickets
        </Link>
        <p className="mt-8 text-sm text-[var(--pg-text-muted)]">Ticket not found.</p>
      </div>
    )
  }

  function handleSend(event) {
    event.preventDefault()
    const text = reply.trim()
    if (!text) return

    setSending(true)
    const next = {
      id: `local-${Date.now()}`,
      author: 'Amine Bennani',
      role: 'Admin',
      initials: 'AB',
      when: 'Just now',
      body: [{ label: 'Reply', text }],
    }

    window.setTimeout(() => {
      setMessages((current) => [...current, next])
      setReply('')
      setSending(false)
    }, 220)
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[860px] px-4 py-8 sm:px-6 sm:py-10">
        <Reveal>
          <Link to="/tickets" className="pg-back-link">
            <IconChevronLeft className="h-3.5 w-3.5" />
            Back to tickets
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
              {ticket.category}
              {ticket.project ? (
                <>
                  <span className="mx-2 text-white/15">·</span>
                  {ticket.project}
                </>
              ) : null}
            </p>
          </div>
          <span className={`pg-status-fill is-${ticket.status} shrink-0 self-start`}>
            {statusLabel(ticket.status)}
          </span>
        </Reveal>

        <div className="mt-8 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.04, duration: 0.35 }}
            >
              <CutFrame as="article" size="md" innerClassName="p-5 sm:p-6">
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
                    <p className="text-xs text-[var(--pg-text-dim)]">{message.when}</p>
                  </div>
                </header>

                <div className="space-y-3 text-[15px] leading-relaxed">
                  {message.body.map((block) => (
                    <p key={`${message.id}-${block.label}`} className="text-slate-300">
                      <span className="font-semibold text-white">{block.label}:</span>{' '}
                      {isUrl(block.text) ? (
                        <a
                          href={block.text}
                          className="text-white underline decoration-white/40 underline-offset-2 transition hover:decoration-[var(--pg-accent)]"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {block.text}
                        </a>
                      ) : (
                        <span>{block.text}</span>
                      )}
                    </p>
                  ))}
                </div>
              </CutFrame>
            </motion.div>
          ))}
        </div>

        <Reveal delay={0.12} className="mt-5">
          <CutFrame as="form" size="md" onSubmit={handleSend} className="block" innerClassName="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.05] px-4 py-2.5">
              <div className="flex items-center gap-1">
                <FormatBtn label="B" className="font-bold" />
                <FormatBtn label="I" className="italic" />
                <FormatBtn label="U" className="underline" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
                Paste or drop images to attach
              </p>
            </div>

            <textarea
              rows={6}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Write a reply..."
              className="min-h-[140px] w-full resize-y border-0 bg-transparent px-4 py-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-0"
            />

            <div className="flex items-center justify-end border-t border-white/[0.05] px-4 py-3">
              <NeonButton type="submit" className={sending || !reply.trim() ? 'pointer-events-none opacity-45' : ''}>
                <IconSend className="h-3.5 w-3.5" />
                {sending ? 'Sending…' : 'Send Reply'}
              </NeonButton>
            </div>
          </CutFrame>
        </Reveal>
      </div>

      <SiteFooter />
    </div>
  )
}

function FormatBtn({ label, className = '' }) {
  return (
    <button type="button" tabIndex={-1} className={`pg-format-btn ${className}`}>
      {label}
    </button>
  )
}

function isUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
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
      <path d="M4 12l16-7-5 16-3-6-8-3z" strokeLinejoin="round" />
    </svg>
  )
}
