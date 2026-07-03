import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as clientPortalApi from '../../api/clientPortal'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { resolveNavPath } from '../../routes/routeAccess'
import { BENTO_CARD_CLASS, PAGE_SUBTITLE_CLASS, PAGE_TITLE_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { LIVE_SYNC_INTERVAL_MS, useAutoRefresh } from '../../hooks/useAutoRefresh'
import ChantierLiveFeed from './components/ChantierLiveFeed'
import ClientContractSignature from './components/ClientContractSignature'
import PortalProjectSelector from './components/PortalProjectSelector'
import ProgressRing, { ProgressBar, useWeekLabel } from './components/ProjectProgressSection'

function MilestoneList({ milestones, loading, t, locale }) {
  if (loading) {
    return <p className="text-sm text-slate-500">{t('common.loading')}</p>
  }

  if (milestones.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/[0.08] bg-[#121316] px-4 py-6 text-sm text-slate-500">
        {t('clientPortal.noMilestones')}
      </p>
    )
  }

  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return (
    <ul className="space-y-2">
      {milestones.map((milestone) => (
        <li
          key={milestone.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#121316] px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{milestone.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {milestone.phase?.name}
              {milestone.project?.title ? ` · ${milestone.project.title}` : ''}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-medium text-indigo-300">
              {milestone.due_date ? dateFmt.format(new Date(milestone.due_date)) : '—'}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{milestone.status}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function ClientPortalDashboardPage() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const weekLabel = useWeekLabel(locale)

  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [media, setMedia] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [error, setError] = useState('')

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  const loadProjects = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadingProjects(true)
      setError('')
    }

    try {
      const data = await clientPortalApi.fetchClientProjects()
      setProjects(data)
      setSelectedProjectId((current) => {
        if (current && data.some((project) => project.id === current)) {
          return current
        }

        return data[0]?.id ?? null
      })
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, t('clientPortal.loadError')))
      }
    } finally {
      if (!silent) {
        setLoadingProjects(false)
      }
    }
  }, [t])

  const loadProjectDetails = useCallback(async (projectId, { silent = false } = {}) => {
    if (!projectId) {
      return
    }

    if (!silent) {
      setLoadingDetails(true)
    }

    try {
      const [milestonesData, mediaData] = await Promise.all([
        clientPortalApi.fetchProjectMilestones(projectId),
        clientPortalApi.fetchProjectMedia(projectId),
      ])

      setMilestones(milestonesData)
      setMedia(mediaData)
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, t('clientPortal.loadError')))
      }
    } finally {
      if (!silent) {
        setLoadingDetails(false)
      }
    }
  }, [t])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDetails(selectedProjectId)
    } else {
      setMilestones([])
      setMedia([])
    }
  }, [selectedProjectId, loadProjectDetails])

  useAutoRefresh(() => {
    loadProjects({ silent: true })
    if (selectedProjectId) {
      loadProjectDetails(selectedProjectId, { silent: true })
    }
  }, LIVE_SYNC_INTERVAL_MS)

  return (
    <div className="list-page space-y-6">
      <header className="page-header">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>{t('clientPortal.dashboardTitle')}</h1>
          <p className={PAGE_SUBTITLE_CLASS}>
            {t('clientPortal.welcome', { name: user?.full_name ?? user?.first_name ?? '' })}
          </p>
        </div>

        <PortalProjectSelector
          projects={projects}
          selectedProjectId={selectedProjectId}
          onChange={setSelectedProjectId}
          label={t('clientPortal.projectSelector')}
        />
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      {loadingProjects ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : projects.length === 0 ? (
        <div className={`${BENTO_CARD_CLASS} space-y-4 p-8 text-center`}>
          <p className="text-sm text-slate-400">{t('clientPortal.noProjects')}</p>
          <p className="text-xs text-slate-500">{t('clientPortal.noProjectsHint')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={resolveNavPath('/portal/quotes', user)}
              className="inline-flex rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/15"
            >
              {t('clientPortal.quotes.title')}
            </Link>
            <Link
              to={resolveNavPath('/portal/discussions', user)}
              className="inline-flex rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-indigo-500/15"
            >
              {t('clientPortal.openDiscussions')}
            </Link>
            <Link
              to={resolveNavPath('/portal/calendar', user)}
              className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.06]"
            >
              {t('clientPortal.openCalendar')}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-3">
            <section className={`${BENTO_CARD_CLASS} p-6 xl:col-span-1`}>
              <h2 className="text-lg font-semibold text-white">{t('clientPortal.progressTitle')}</h2>
              <p className="mt-1 text-sm text-slate-400">{selectedProject?.title}</p>

              <div className="mt-6 flex flex-col items-center gap-6">
                <ProgressRing
                  percent={selectedProject?.progress_percent ?? 0}
                  label={t('clientPortal.overallProgress')}
                />
                <ProgressBar
                  percent={selectedProject?.progress_percent ?? 0}
                  label={t('clientPortal.completion')}
                />
                <dl className="grid w-full grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-[#121316] px-3 py-2">
                    <dt className="text-slate-500">{t('clientPortal.reference')}</dt>
                    <dd className="mt-1 font-medium text-white">{selectedProject?.reference}</dd>
                  </div>
                  <div className="rounded-lg bg-[#121316] px-3 py-2">
                    <dt className="text-slate-500">{t('clientPortal.status')}</dt>
                    <dd className="mt-1 font-medium capitalize text-white">{selectedProject?.status}</dd>
                  </div>
                  <div className="rounded-lg bg-[#121316] px-3 py-2">
                    <dt className="text-slate-500">{t('clientPortal.city')}</dt>
                    <dd className="mt-1 font-medium text-white">{selectedProject?.site_city ?? '—'}</dd>
                  </div>
                  <div className="rounded-lg bg-[#121316] px-3 py-2">
                    <dt className="text-slate-500">{t('clientPortal.endDate')}</dt>
                    <dd className="mt-1 font-medium text-white">{selectedProject?.end_date ?? '—'}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className={`${BENTO_CARD_CLASS} p-6 xl:col-span-2`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{t('clientPortal.calendarTitle')}</h2>
                  <p className="mt-1 text-sm text-slate-400">{t('clientPortal.calendarSubtitle')}</p>
                </div>
                <span className="rounded-lg bg-[#121316] px-3 py-1.5 text-xs text-slate-400">{weekLabel}</span>
              </div>
              <MilestoneList
                milestones={milestones}
                loading={loadingDetails}
                t={t}
                locale={locale}
              />
            </section>
          </div>

          <ChantierLiveFeed media={media} loading={loadingDetails} />

          <ClientContractSignature projectId={selectedProjectId} />
        </>
      )}
    </div>
  )
}
