import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import NeonButton from '../../components/prodigy/NeonButton'
import PageShell from '../../components/prodigy/PageShell'
import Reveal from '../../components/prodigy/Reveal'
import { TICKET_FILTERS, getTickets, statusLabel } from './ticketsData'

export default function TicketsPage() {
  const [filter, setFilter] = useState('all')

  const tickets = useMemo(() => {
    const all = getTickets()
    if (filter === 'all') return all
    return all.filter((ticket) => ticket.status === filter)
  }, [filter])

  return (
    <PageShell
      compact
      title="My Tickets"
      actions={(
        <NeonButton to="/tickets/new">
          <span aria-hidden>+</span>
          New Ticket
        </NeonButton>
      )}
    >
      <Reveal className="mb-5 flex flex-wrap gap-2">
        {TICKET_FILTERS.map((item) => {
          const active = filter === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`pg-filter ${active ? 'is-active' : ''}`}
            >
              <span className="pg-filter__face">{item.label}</span>
            </button>
          )
        })}
      </Reveal>

      <Reveal delay={0.06} className="flex flex-col gap-2.5">
        {tickets.map((ticket, index) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to={`/tickets/${ticket.id}`} className="pg-ticket">
              <span className="pg-ticket__face">
                <span className="pg-ticket-id">#{ticket.id}</span>
                <span className="min-w-0">
                  <span className="pg-ticket-title block truncate">{ticket.title}</span>
                  <span className="pg-ticket-meta block truncate">
                    {ticket.category}
                    <span className="mx-1.5 text-white/20">·</span>
                    {ticket.when}
                  </span>
                </span>
                <span className={`pg-ticket-status is-${ticket.status}`}>
                  {statusLabel(ticket.status)}
                </span>
              </span>
            </Link>
          </motion.div>
        ))}

        {tickets.length === 0 ? (
          <div className="pg-cut-shell pg-cut-shell--lg">
            <div className="pg-cut-shell__inner px-6 py-16 text-center">
              <p className="text-sm font-semibold text-slate-300">No tickets in this filter</p>
              <p className="mt-1 text-xs text-[var(--pg-text-dim)]">
                Try another status or create a new ticket.
              </p>
            </div>
          </div>
        ) : null}
      </Reveal>
    </PageShell>
  )
}
