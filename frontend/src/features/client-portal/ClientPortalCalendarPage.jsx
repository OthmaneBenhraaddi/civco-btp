import { useCallback, useEffect, useMemo, useState } from 'react'
import * as clientPortalApi from '../../api/clientPortal'
import { useTranslation } from '../../i18n/LanguageContext'
import { BENTO_CARD_CLASS, PAGE_SUBTITLE_CLASS, PAGE_TITLE_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'
import PortalMonthCalendar from './components/PortalMonthCalendar'
import PortalProjectSelector from './components/PortalProjectSelector'

export default function ClientPortalCalendarPage() {
  const { t, locale } = useTranslation()

  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError('')

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
      setError(extractErrorMessage(err, t('clientPortal.loadError')))
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadMilestones = useCallback(async (projectId) => {
    if (!projectId) {
      setMilestones([])
      return
    }

    try {
      const data = await clientPortalApi.fetchProjectMilestones(projectId)
      setMilestones(data)
    } catch (err) {
      setError(extractErrorMessage(err, t('clientPortal.loadError')))
    }
  }, [t])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    loadMilestones(selectedProjectId)
  }, [selectedProjectId, loadMilestones])

  return (
    <div className="list-page space-y-6">
      <header className="page-header">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>{t('clientPortal.calendarPageTitle')}</h1>
          <p className={PAGE_SUBTITLE_CLASS}>{t('clientPortal.calendarPageSubtitle')}</p>
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

      <section className={`${BENTO_CARD_CLASS} p-6`}>
        {loading ? (
          <p className="text-sm text-slate-500">{t('common.loading')}</p>
        ) : (
          <>
            {selectedProject ? (
              <p className="mb-4 text-sm text-slate-400">
                {t('clientPortal.calendarProjectContext', {
                  reference: selectedProject.reference,
                  title: selectedProject.title,
                })}
              </p>
            ) : null}
            <PortalMonthCalendar
              locale={locale}
              milestones={milestones}
              emptyLabel={t('clientPortal.noEvents')}
            />
          </>
        )}
      </section>
    </div>
  )
}
