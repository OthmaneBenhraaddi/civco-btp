import { useEffect, useMemo, useState } from 'react'
import SearchInput from '../../components/SearchInput'
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
    <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-[#0f1013] py-20 text-center">
      <p className="text-base font-medium text-white">{t('tasks.noProjectSelected')}</p>
      <p className="mt-1 text-sm text-slate-500">{t('tasks.noProjectSelectedHint')}</p>
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

  function handleProjectChange(event) {
    const value = event.target.value
    setSelectedProjectId(value === '' ? null : value)
    setSearch('')
    setStatusFilter('')
  }

  return (
    <div className="tasks-page mx-auto flex max-w-[1600px] flex-col gap-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-white">{t('tasks.title')}</h1>
        {hasProjectSelected ? (
          <button type="button" className="tasks-create-btn" onClick={() => setCreateOpen(true)}>
            {t('tasks.new')}
          </button>
        ) : null}
      </header>

      <div className="tasks-project-bar flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {t('tasks.projectSelector.label')}
        </label>
        <select
          className="tasks-project-select filter-select min-w-[240px] max-w-md"
          value={selectedProjectId ?? ''}
          onChange={handleProjectChange}
          disabled={projectsLoading}
        >
          <option value="">{t('tasks.projectSelector.placeholder')}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
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
              <select
                className="filter-select min-w-[180px]"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">{t('tasks.allStatuses')}</option>
                <option value="working">{t('tasks.statuses.working')}</option>
                <option value="done">{t('tasks.statuses.done')}</option>
                <option value="stuck">{t('tasks.statuses.stuck')}</option>
                <option value="not_started">{t('tasks.statuses.not_started')}</option>
              </select>
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
    </div>
  )
}
