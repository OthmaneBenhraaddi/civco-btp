import { useMemo, useState } from 'react'
import SearchInput from '../../components/SearchInput'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { useProjectTasks } from '../../hooks/useProjectTasks'
import { STATUT_FILTER_MAP } from './types'
import TaskCalendarView from './components/TaskCalendarView'
import TaskCreateModal from './components/TaskCreateModal'
import TaskEditModal from './components/TaskEditModal'
import TaskDashboardView from './components/TaskDashboardView'
import TaskTableView from './components/TaskTableView'
import TaskViewTabs from './components/TaskViewTabs'
import {
  canCreateTasks,
  canManageAllTasks,
  canManageTask,
  filterVisibleTasks,
} from './utils/taskPermissions'
import { TASKS_COC_CLASS, TASKS_COC_ENABLED } from './tasksTheme'
import './tasksCoc.css'

const VIEWS = {
  spreadsheet: 'spreadsheet',
  dashboard: 'dashboard',
  calendar: 'calendar',
}

function TasksEmptyProjectState({ t }) {
  return (
    <div className="tasks-empty-state mt-6 flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-[#0f1013] py-20 text-center">
      <p className="text-base font-medium text-white">{t('tasks.noProjectSelected')}</p>
      <p className="mt-1 text-sm text-slate-500">{t('tasks.noProjectSelectedHint')}</p>
    </div>
  )
}

export default function TasksPage() {
  const { t } = useTranslation()
  const { user, isAdmin, hasPermission } = useAuth()
  const taskAccess = { user, isAdmin, hasPermission }
  const showCreateButton = canCreateTasks(taskAccess)
  const { tasks, projects, loading: projectsLoading, setTasks, refresh } = useProjectTasks()
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [activeView, setActiveView] = useState(VIEWS.spreadsheet)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

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

  const projectOptions = useMemo(
    () => [
      { value: '', label: t('tasks.projectSelector.placeholder') },
      ...projects.map((project) => ({
        value: String(project.id),
        label: project.title,
      })),
    ],
    [projects, t],
  )

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('tasks.allStatuses') },
      { value: 'working', label: t('tasks.statuses.working') },
      { value: 'done', label: t('tasks.statuses.done') },
      { value: 'stuck', label: t('tasks.statuses.stuck') },
      { value: 'not_started', label: t('tasks.statuses.not_started') },
    ],
    [t],
  )

  const visibleTasks = useMemo(
    () => filterVisibleTasks(tasks, taskAccess),
    [tasks, user?.id, isAdmin, hasPermission],
  )

  const filteredTasks = useMemo(() => {
    if (!hasProjectSelected) {
      return []
    }

    const statutValue = STATUT_FILTER_MAP[statusFilter]
    const query = search.trim().toLowerCase()
    const projectKey = String(selectedProjectId)

    return visibleTasks.filter((task) => {
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
  }, [hasProjectSelected, search, selectedProjectId, statusFilter, visibleTasks])

  function handleTaskUpdated(updatedTask) {
    setTasks((current) => current.map((task) => (
      String(task.id) === String(updatedTask.id) ? updatedTask : task
    )))
  }

  function handleTaskDeleted(taskId) {
    setTasks((current) => current.filter((task) => String(task.id) !== String(taskId)))
  }
  function handleTaskCreated(task) {
    setTasks((current) => [task, ...current])
    refresh()
  }

  function handleProjectChange(next) {
    setSelectedProjectId(next === '' ? null : next)
    setSearch('')
    setStatusFilter('')
  }

  const hasAnyTaskActions = canManageAllTasks(taskAccess)
    || visibleTasks.some((task) => canManageTask(task, taskAccess))

  return (
    <div className={`tasks-page list-page mx-auto flex max-w-[1600px] flex-col gap-y-6 ${TASKS_COC_CLASS}`.trim()}>
      <header className="page-header flex flex-wrap items-center justify-between gap-4">
        <h1>{t('tasks.title')}</h1>
        {hasProjectSelected && showCreateButton ? (
          TASKS_COC_ENABLED ? (
            <NeonButton type="button" size="sm" onClick={() => setCreateOpen(true)}>
              {t('tasks.new')}
            </NeonButton>
          ) : (
            <button type="button" className="tasks-create-btn" onClick={() => setCreateOpen(true)}>
              {t('tasks.new')}
            </button>
          )
        ) : null}
      </header>

      <div className="tasks-project-bar flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {t('tasks.projectSelector.label')}
        </label>
        <CutSelect
          className="tasks-project-select min-w-[240px] max-w-md"
          value={selectedProjectId ?? ''}
          options={projectOptions}
          placeholder={t('tasks.projectSelector.placeholder')}
          disabled={projectsLoading}
          onChange={handleProjectChange}
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
                options={statusOptions}
                onChange={setStatusFilter}
              />
            </div>

            <div className="tasks-view-panel">
              {activeView === VIEWS.spreadsheet && (
                <TaskTableView
                  tasks={filteredTasks}
                  t={t}
                  canManageTask={hasAnyTaskActions ? (task) => canManageTask(task, taskAccess) : null}
                  onEditTask={setEditingTask}
                />
              )}

              {activeView === VIEWS.dashboard && (
                <TaskDashboardView tasks={filteredTasks} t={t} />
              )}

              {activeView === VIEWS.calendar && (
                <TaskCalendarView tasks={filteredTasks} t={t} />
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

      <TaskEditModal
        open={Boolean(editingTask)}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onUpdated={handleTaskUpdated}
        onDeleted={handleTaskDeleted}
      />
    </div>
  )
}
