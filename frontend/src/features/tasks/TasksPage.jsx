import { useEffect, useMemo, useState } from 'react'
import SearchInput from '../../components/SearchInput'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import PageShell from '../../components/prodigy/PageShell'
import { useTranslation } from '../../i18n/LanguageContext'
import * as projectsApi from '../../api/projects'
import { appendTask, readTasks } from './taskStore'
import { STATUT_FILTER_MAP } from './types'
import TaskCalendarView from './components/TaskCalendarView'
import TaskCreateModal from './components/TaskCreateModal'
import TaskDashboardView from './components/TaskDashboardView'
import TaskTableView from './components/TaskTableView'
import TaskViewTabs from './components/TaskViewTabs'

const VIEWS = {
  spreadsheet: 'spreadsheet',
  dashboard: 'dashboard',
  calendar: 'calendar',
}

function TasksEmptyProjectState({ t }) {
  return (
    <div className="pg-panel mt-2 flex flex-col items-center justify-center py-20 text-center">
      <p className="text-base font-semibold text-white">{t('tasks.noProjectSelected')}</p>
      <p className="mt-1 text-sm text-[var(--pg-text-dim)]">{t('tasks.noProjectSelectedHint')}</p>
    </div>
  )
}

export default function TasksPage() {
  const { t, locale } = useTranslation()
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [activeView, setActiveView] = useState(VIEWS.spreadsheet)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tasks, setTasks] = useState(() => readTasks())
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    projectsApi.fetchProjects({ per_page: 100 })
      .then((data) => setProjects(data.data ?? []))
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false))
  }, [])

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)) ?? null,
    [projects, selectedProjectId],
  )

  const hasProjectSelected = selectedProjectId !== null && selectedProjectId !== ''

  const tabs = [
    { id: VIEWS.spreadsheet, label: t('tasks.views.spreadsheet') },
    { id: VIEWS.dashboard, label: t('tasks.views.dashboard') },
    { id: VIEWS.calendar, label: t('tasks.views.calendar') },
  ]

  const filteredTasks = useMemo(() => {
    if (!hasProjectSelected) {
      return []
    }

    const statutValue = STATUT_FILTER_MAP[statusFilter]
    const query = search.trim().toLowerCase()
    const projectKey = String(selectedProjectId)

    return tasks.filter((task) => {
      if (String(task.projectId) !== projectKey) {
        return false
      }

      const matchesStatus = !statutValue || task.statut === statutValue
      const matchesSearch = !query
        || task.nom.toLowerCase().includes(query)
        || task.responsable.name.toLowerCase().includes(query)
        || task.notes.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [hasProjectSelected, search, selectedProjectId, statusFilter, tasks])

  function handleTaskCreated(task) {
    setTasks(appendTask(task))
  }

  function handleProjectChange(value) {
    setSelectedProjectId(value === '' ? null : value)
    setSearch('')
    setStatusFilter('')
  }

  return (
    <PageShell
      wide
      compact
      className="tasks-page"
      title={t('tasks.title')}
      actions={hasProjectSelected ? (
        <NeonButton onClick={() => setCreateOpen(true)}>{t('tasks.new')}</NeonButton>
      ) : null}
    >
      <div className="tasks-project-bar mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--pg-text-dim)]">
          {t('tasks.projectSelector.label')}
        </label>
        <CutSelect
          className="min-w-[240px] max-w-md"
          value={selectedProjectId ?? ''}
          onChange={handleProjectChange}
          disabled={projectsLoading}
          placeholder={t('tasks.projectSelector.placeholder')}
          options={[
            { value: '', label: t('tasks.projectSelector.placeholder') },
            ...projects.map((project) => ({
              value: String(project.id),
              label: project.title,
            })),
          ]}
        />
      </div>

      {!hasProjectSelected ? (
        <TasksEmptyProjectState t={t} />
      ) : (
        <>
          <TaskViewTabs activeView={activeView} onChange={setActiveView} tabs={tabs} />

          <div className="flex flex-col gap-y-6">
            <div className="tasks-controls toolbar flex flex-wrap items-end gap-3">
              <SearchInput
                placeholder={t('tasks.search')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <CutSelect
                className="min-w-[180px]"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: '', label: t('tasks.allStatuses') },
                  { value: 'working', label: t('tasks.statuses.working') },
                  { value: 'done', label: t('tasks.statuses.done') },
                  { value: 'stuck', label: t('tasks.statuses.stuck') },
                  { value: 'not_started', label: t('tasks.statuses.not_started') },
                ]}
              />
            </div>

            <div className="tasks-view-panel">
              {activeView === VIEWS.spreadsheet && (
                <TaskTableView tasks={filteredTasks} locale={locale} t={t} />
              )}

              {activeView === VIEWS.dashboard && (
                <TaskDashboardView tasks={filteredTasks} t={t} />
              )}

              {activeView === VIEWS.calendar && (
                <TaskCalendarView tasks={filteredTasks} locale={locale} t={t} />
              )}
            </div>
          </div>
        </>
      )}

      <TaskCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleTaskCreated}
        defaultProjectId={selectedProjectId}
        defaultProjectName={selectedProject?.title ?? ''}
      />
    </PageShell>
  )
}
