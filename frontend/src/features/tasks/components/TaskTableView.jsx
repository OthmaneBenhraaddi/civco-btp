import { useState } from 'react'
import { formatMoney } from '../../../utils/currency'
import { PRIORITE_I18N_KEY, STATUT_I18N_KEY, STATUT_STRIP_COLORS } from '../types'
import DocumentPreviewDrawer from './DocumentPreviewDrawer'
import TaskDocumentsIndicator from './TaskDocumentsIndicator'
import TaskPriorityBadge from './TaskPriorityBadge'
import TaskStatusBadge from './TaskStatusBadge'

function formatDueDate(isoDate) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ProjectBadge({ name }) {
  return (
    <span className="inline-flex max-w-[140px] truncate rounded-md bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-slate-700/50">
      {name}
    </span>
  )
}

export default function TaskTableView({ tasks, t, canManageTask, onEditTask }) {
  const [previewState, setPreviewState] = useState({ open: false, files: [] })

  function openPreview(files) {
    setPreviewState({ open: true, files })
  }

  function closePreview() {
    setPreviewState({ open: false, files: [] })
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/70 bg-[#0f1013] px-6 py-12 text-center text-sm text-slate-400">
        {t('tasks.empty')}
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-800/70 bg-[#0f1013] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="task-table w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800/80 bg-[#0a0b0d]/80">
                <th className="px-4 py-4">{t('tasks.columns.name')}</th>
                <th className="px-4 py-4">{t('tasks.columns.project')}</th>
                <th className="px-4 py-4">{t('tasks.columns.owner')}</th>
                <th className="px-4 py-4">{t('tasks.columns.status')}</th>
                <th className="px-4 py-4">{t('tasks.columns.dueDate')}</th>
                <th className="px-4 py-4">{t('tasks.columns.priority')}</th>
                <th className="px-4 py-4">{t('tasks.columns.budget')}</th>
                <th className="px-4 py-4">{t('tasks.columns.files')}</th>
                <th className="px-4 py-4">{t('tasks.columns.notes')}</th>
                <th className="px-4 py-4">{t('tasks.columns.lastUpdated')}</th>
                {canManageTask ? <th className="px-4 py-4">{t('common.actions')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className={`group border-b border-slate-800/50 border-l-[3px] transition-all duration-200 ease-in-out last:border-b-0 hover:bg-white/[0.02] ${STATUT_STRIP_COLORS[task.statut]}`}
                >
                  <td className="px-4 py-4 font-medium text-white">{task.nom}</td>
                  <td className="px-4 py-4">
                    <ProjectBadge name={task.projectName} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={task.responsable.avatarUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full ring-2 ring-slate-800"
                      />
                      <span className="whitespace-nowrap text-slate-300">{task.responsable.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <TaskStatusBadge
                      status={task.statut}
                      label={t(`tasks.statuses.${STATUT_I18N_KEY[task.statut]}`)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-300">
                    {formatDueDate(task.echeance)}
                  </td>
                  <td className="px-4 py-4">
                    <TaskPriorityBadge
                      priority={task.priorite}
                      label={t(`tasks.priorities.${PRIORITE_I18N_KEY[task.priorite]}`)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-slate-200">
                    {formatMoney(task.budget)}
                  </td>
                  <td className="px-4 py-4">
                    <TaskDocumentsIndicator
                      files={task.fichiers}
                      docLabel={t('tasks.files.count', { count: task.fichiers.length })}
                      onOpen={openPreview}
                    />
                  </td>
                  <td className="max-w-[200px] px-4 py-4">
                    <p className="line-clamp-2 text-slate-400" title={task.notes}>{task.notes}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <p className="text-slate-300">{task.lastUpdatedBy}</p>
                    <p className="text-xs text-slate-500">{task.lastUpdatedAt}</p>
                  </td>
                  {canManageTask ? (
                    <td className="px-4 py-4">
                      {canManageTask(task) ? (
                        <button
                          type="button"
                          className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-white/5"
                          onClick={() => onEditTask?.(task)}
                        >
                          {t('tasks.open')}
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DocumentPreviewDrawer
        open={previewState.open}
        files={previewState.files}
        onClose={closePreview}
      />
    </>
  )
}
