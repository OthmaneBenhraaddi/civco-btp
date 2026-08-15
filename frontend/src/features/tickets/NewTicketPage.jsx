import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as clientPortalApi from '../../api/clientPortal'
import * as clientsApi from '../../api/clients'
import * as portalTicketsApi from '../../api/clientPortalTickets'
import * as projectsApi from '../../api/projects'
import * as ticketsApi from '../../api/tickets'
import CutFrame from '../../components/prodigy/CutFrame'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import Reveal from '../../components/prodigy/Reveal'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { useActionToast } from '../../hooks/useActionToast'
import { extractErrorMessage } from '../../utils/apiHelpers'
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from './ticketsData'
import { useTicketsBasePath } from './useTicketsBasePath'

export default function NewTicketPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const basePath = useTicketsBasePath()
  const { isClientPortalUser, hasPermission } = useAuth()
  const { toastSuccess, toastError } = useActionToast()

  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loadingClients, setLoadingClients] = useState(!isClientPortalUser)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canCreate = isClientPortalUser || hasPermission('ticket.create')

  useEffect(() => {
    if (isClientPortalUser) return undefined

    let cancelled = false

    async function loadClients() {
      setLoadingClients(true)
      try {
        const response = await clientsApi.fetchClientsForPicker()
        const list = response.data ?? response ?? []
        const mapped = (Array.isArray(list) ? list : []).map((client) => ({
          id: String(client.id),
          label: client.name ?? `Client #${client.id}`,
        }))
        if (!cancelled) setClients(mapped)
      } catch {
        if (!cancelled) setClients([])
      } finally {
        if (!cancelled) setLoadingClients(false)
      }
    }

    loadClients()
    return () => {
      cancelled = true
    }
  }, [isClientPortalUser])

  useEffect(() => {
    let cancelled = false

    async function loadProjects() {
      setLoadingProjects(true)
      try {
        if (isClientPortalUser) {
          const list = await clientPortalApi.fetchClientProjects()
          const mapped = (list ?? []).map((project) => ({
            id: String(project.id),
            label: project.title ?? project.reference ?? `Projet #${project.id}`,
          }))
          if (!cancelled) setProjects(mapped)
          return
        }

        if (!clientId) {
          if (!cancelled) setProjects([])
          return
        }

        const response = await projectsApi.fetchProjects({
          per_page: 100,
          client_id: Number(clientId),
        })
        const list = response.data ?? response ?? []
        const mapped = list.map((project) => ({
          id: String(project.id),
          label: project.title ?? project.reference ?? `Projet #${project.id}`,
        }))
        if (!cancelled) setProjects(mapped)
      } catch {
        if (!cancelled) setProjects([])
      } finally {
        if (!cancelled) setLoadingProjects(false)
      }
    }

    loadProjects()
    return () => {
      cancelled = true
    }
  }, [isClientPortalUser, clientId])

  useEffect(() => {
    setProjectId('')
  }, [clientId])

  const canSubmit = useMemo(() => {
    const base = Boolean(title.trim() && priority && category && description.trim())
    if (!base) return false
    if (isClientPortalUser) return Boolean(projectId)
    return Boolean(clientId)
  }, [title, projectId, clientId, priority, category, description, isClientPortalUser])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canCreate) {
      setError(t('tickets.forbidden'))
      return
    }
    if (!canSubmit) {
      setError(t(isClientPortalUser ? 'tickets.formRequired' : 'tickets.formRequiredStaff'))
      return
    }

    if (isClientPortalUser) {
      const selectedProject = projects.find((project) => String(project.id) === String(projectId))
      if (!selectedProject) {
        setError(t('tickets.invalidProject'))
        return
      }
    } else {
      const selectedClient = clients.find((client) => String(client.id) === String(clientId))
      if (!selectedClient) {
        setError(t('tickets.invalidClient'))
        return
      }
      if (projectId) {
        const selectedProject = projects.find((project) => String(project.id) === String(projectId))
        if (!selectedProject) {
          setError(t('tickets.invalidProject'))
          return
        }
      }
    }

    setSubmitting(true)
    setError('')

    const payload = isClientPortalUser
      ? {
          title: title.trim(),
          project_id: Number(projectId),
          category,
          priority,
          body: description.trim(),
        }
      : {
          title: title.trim(),
          client_id: Number(clientId),
          ...(projectId ? { project_id: Number(projectId) } : {}),
          category,
          priority,
          body: description.trim(),
        }

    try {
      const ticket = isClientPortalUser
        ? await portalTicketsApi.createPortalTicket(payload)
        : await ticketsApi.createTicket(payload)
      toastSuccess(t('toast.messages.ticketCreated'))
      navigate(`${basePath}/${ticket.id}`)
    } catch (err) {
      const message = extractErrorMessage(err, t('tickets.createError'))
      setError(message)
      toastError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!canCreate) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-6">
        <Link to={basePath} className="pg-back-link">
          <IconChevronLeft className="h-3.5 w-3.5" />
          {t('tickets.backToList')}
        </Link>
        <p className="mt-8 text-sm text-[var(--pg-text-muted)]">{t('tickets.forbidden')}</p>
      </div>
    )
  }

  const submitBlocked =
    submitting ||
    !canSubmit ||
    (isClientPortalUser ? projects.length === 0 : clients.length === 0)

  return (
    <div className="min-h-full pb-12">
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6 sm:py-10">
        <Reveal>
          <Link to={basePath} className="pg-back-link">
            <IconChevronLeft className="h-3.5 w-3.5" />
            {t('tickets.backToList')}
          </Link>
        </Reveal>

        <Reveal delay={0.04} className="mt-8 text-center">
          <h1 className="pg-section-title">{t('tickets.newTitle')}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--pg-text-muted)]">
            {t(isClientPortalUser ? 'tickets.newSubtitle' : 'tickets.newSubtitleStaff')}
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-8">
          <CutFrame
            size="lg"
            as="form"
            onSubmit={handleSubmit}
            className="block"
            innerClassName="bg-[#0e131f] p-5 sm:p-7"
          >
            <label className="pg-field">
              <span className="pg-field-label">{t('tickets.fields.title')}</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t('tickets.fields.titlePlaceholder')}
                className="pg-field-control"
                required
              />
            </label>

            {!isClientPortalUser ? (
              <label className="pg-field mt-5">
                <span className="pg-field-label">{t('tickets.fields.client')}</span>
                <CutSelect
                  className="w-full"
                  value={clientId}
                  onChange={setClientId}
                  disabled={loadingClients || clients.length === 0}
                  placeholder={
                    loadingClients
                      ? t('common.loading')
                      : clients.length === 0
                        ? t('tickets.noClients')
                        : t('tickets.fields.clientPlaceholder')
                  }
                  options={[
                    { value: '', label: t('tickets.fields.clientPlaceholder') },
                    ...clients.map((client) => ({
                      value: client.id,
                      label: client.label,
                    })),
                  ]}
                />
              </label>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="pg-field">
                <span className="pg-field-label">
                  {t('tickets.fields.project')}
                  {!isClientPortalUser ? (
                    <span className="ml-1 font-medium normal-case tracking-normal text-[var(--pg-text-dim)]">
                      ({t('tickets.fields.optional')})
                    </span>
                  ) : null}
                </span>
                <CutSelect
                  className="w-full"
                  value={projectId}
                  onChange={setProjectId}
                  disabled={
                    loadingProjects ||
                    (isClientPortalUser ? projects.length === 0 : !clientId)
                  }
                  placeholder={
                    loadingProjects
                      ? t('common.loading')
                      : isClientPortalUser
                        ? projects.length === 0
                          ? t('tickets.noProjects')
                          : t('tickets.fields.projectPlaceholder')
                        : !clientId
                          ? t('tickets.fields.projectAfterClient')
                          : projects.length === 0
                            ? t('tickets.noProjectsForClient')
                            : t('tickets.fields.projectOptionalPlaceholder')
                  }
                  options={[
                    {
                      value: '',
                      label: isClientPortalUser
                        ? t('tickets.fields.projectPlaceholder')
                        : t('tickets.fields.projectOptionalPlaceholder'),
                    },
                    ...projects.map((project) => ({
                      value: project.id,
                      label: project.label,
                    })),
                  ]}
                />
              </label>

              <label className="pg-field">
                <span className="pg-field-label">{t('tickets.fields.priority')}</span>
                <CutSelect
                  className="w-full"
                  value={priority}
                  onChange={setPriority}
                  options={TICKET_PRIORITIES.map((item) => ({
                    value: item.id,
                    label: t(item.labelKey),
                  }))}
                />
              </label>
            </div>

            <label className="pg-field mt-5">
              <span className="pg-field-label">{t('tickets.fields.category')}</span>
              <CutSelect
                className="w-full"
                value={category}
                onChange={setCategory}
                placeholder={t('tickets.fields.categoryPlaceholder')}
                options={[
                  { value: '', label: t('tickets.fields.categoryPlaceholder') },
                  ...TICKET_CATEGORIES.map((item) => ({ value: item, label: item })),
                ]}
              />
            </label>

            <label className="pg-field mt-5">
              <span className="pg-field-label">{t('tickets.fields.description')}</span>
              <CutFrame size="sm" className="block" innerClassName="overflow-hidden bg-[#0e121b]">
                <textarea
                  rows={8}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={t('tickets.fields.descriptionPlaceholder')}
                  className="min-h-[180px] w-full resize-y border-0 bg-transparent px-3 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-0"
                  required
                />
              </CutFrame>
            </label>

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
              <NeonButton to={basePath} variant="ghost">
                {t('common.cancel')}
              </NeonButton>
              <NeonButton
                type="submit"
                disabled={submitBlocked}
                className={submitBlocked ? 'opacity-45' : ''}
              >
                {submitting ? t('tickets.submitting') : t('tickets.submit')}
              </NeonButton>
            </div>
          </CutFrame>
        </Reveal>
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
