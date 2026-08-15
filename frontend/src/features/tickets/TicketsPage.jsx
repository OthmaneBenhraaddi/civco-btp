import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as ticketsApi from '../../api/tickets'
import * as portalTicketsApi from '../../api/clientPortalTickets'
import NeonButton from '../../components/prodigy/NeonButton'
import PageShell from '../../components/prodigy/PageShell'
import Reveal from '../../components/prodigy/Reveal'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { useActionToast } from '../../hooks/useActionToast'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { formatRelativeTime } from '../../utils/formatRelativeTime'
import {
  TICKET_FILTERS,
  mapTicketListItem,
  priorityLabel,
  statusClassName,
  statusLabel,
  statusParamForFilter,
  ticketMetaLine,
} from './ticketsData'
import { useTicketsBasePath } from './useTicketsBasePath'

export default function TicketsPage() {
  const { t } = useTranslation()
  const basePath = useTicketsBasePath()
  const { isClientPortalUser, hasPermission } = useAuth()
  const { toastError } = useActionToast()
  const [filter, setFilter] = useState('all')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canCreate = isClientPortalUser || hasPermission('ticket.create')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const status = statusParamForFilter(filter, isClientPortalUser)
        const params = status ? { status } : {}
        const response = isClientPortalUser
          ? await portalTicketsApi.fetchPortalTickets(params)
          : await ticketsApi.fetchTickets(params)
        const rows = response?.data ?? response ?? []
        if (!cancelled) {
          setTickets(Array.isArray(rows) ? rows.map(mapTicketListItem) : [])
        }
      } catch (err) {
        if (!cancelled) {
          setTickets([])
          const message = extractErrorMessage(err, t('tickets.loadError'))
          setError(message)
          toastError(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [filter, isClientPortalUser, t])

  const emptyLabel = useMemo(() => {
    if (loading) return t('common.loading')
    if (error) return error
    return null
  }, [loading, error, t])

  return (
    <PageShell
      compact
      title={t('tickets.title')}
      subtitle={t('tickets.subtitle')}
      actions={canCreate ? (
        <NeonButton to={`${basePath}/new`}>
          <span aria-hidden>+</span>
          {t('tickets.new')}
        </NeonButton>
      ) : null}
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
              <span className="pg-filter__face">{t(item.labelKey)}</span>
            </button>
          )
        })}
      </Reveal>

      <Reveal delay={0.06} className="flex flex-col gap-2.5">
        {emptyLabel ? (
          <div className="pg-cut-shell pg-cut-shell--lg">
            <div className="pg-cut-shell__inner bg-[#0e131f] px-6 py-16 text-center">
              <p className="text-sm font-semibold text-slate-300">{emptyLabel}</p>
            </div>
          </div>
        ) : null}

        {!loading && !error
          ? tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link to={`${basePath}/${ticket.id}`} className="pg-ticket">
                  <span className="pg-ticket__face">
                    <span className="pg-ticket-id">#{ticket.id}</span>
                    <span className="min-w-0">
                      <span className="pg-ticket-title block truncate">{ticket.title}</span>
                      <span className="pg-ticket-meta block truncate">
                        {ticketMetaLine(ticket)}
                        {!isClientPortalUser && ticket.project ? (
                          <>
                            <span className="mx-1.5 text-white/20">·</span>
                            {ticket.client}
                          </>
                        ) : null}
                        <span className="mx-1.5 text-white/20">·</span>
                        {priorityLabel(ticket.priority, t)}
                        <span className="mx-1.5 text-white/20">·</span>
                        {formatRelativeTime(ticket.when)}
                      </span>
                    </span>
                    <span className={`pg-ticket-status ${statusClassName(ticket.status, isClientPortalUser)}`}>
                      {statusLabel(ticket.status, t, { isClientPortalUser })}
                    </span>
                  </span>
                </Link>
              </motion.div>
            ))
          : null}

        {!loading && !error && tickets.length === 0 ? (
          <div className="pg-cut-shell pg-cut-shell--lg">
            <div className="pg-cut-shell__inner bg-[#0e131f] px-6 py-16 text-center">
              <p className="text-sm font-semibold text-slate-300">{t('tickets.emptyTitle')}</p>
              <p className="mt-1 text-xs text-[var(--pg-text-dim)]">{t('tickets.emptyBody')}</p>
            </div>
          </div>
        ) : null}
      </Reveal>
    </PageShell>
  )
}
