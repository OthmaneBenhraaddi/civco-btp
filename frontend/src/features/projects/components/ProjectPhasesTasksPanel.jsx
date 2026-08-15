import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Circle, Loader2, Trash2 } from 'lucide-react'
import NeonButton from '../../../components/prodigy/NeonButton'
import CutSelect from '../../../components/prodigy/CutSelect'
import { useTranslation } from '../../../i18n/LanguageContext'
import { formatMoney } from '../../../utils/currency'
import { unwrapResource } from '../../../utils/apiHelpers'
import { BENTO_CARD_CLASS, FIELD_CLASS } from '../../../theme/designTokens'

const IN_PROGRESS_PRESETS = [25, 50, 75]

const STATUS_META = {
  todo: {
    labelKey: 'status.todo',
    className: 'border-slate-600/70 bg-slate-800/80 text-slate-300',
    bar: 'bg-slate-500',
  },
  in_progress: {
    labelKey: 'status.in_progress',
    className: 'border-amber-400/50 bg-amber-500/15 text-amber-300',
    bar: 'bg-amber-400',
  },
  done: {
    labelKey: 'status.done',
    className: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300',
    bar: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]',
  },
}

function averagePhaseProgress(tasks, taskProgress) {
  const list = unwrapResource(tasks)
  if (list.length === 0) return 0
  const sum = list.reduce(
    (total, task) => total + Number(taskProgress[task.id] ?? task.progress_percent ?? 0),
    0,
  )
  return Math.round((sum / list.length) * 10) / 10
}

function TrashIconButton({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
    </button>
  )
}

function ProgressBar({ value, tone = 'done' }) {
  const fill = STATUS_META[tone]?.bar ?? STATUS_META.done.bar
  const width = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
      <div
        className={`h-full rounded-full transition-all duration-300 ${fill}`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

function TaskStatusControl({ task, progress, disabled, onChange, t }) {
  const [open, setOpen] = useState(false)
  const [pickingPercent, setPickingPercent] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const listId = useId()

  const status = task.status === 'blocked' ? 'todo' : task.status
  const meta = STATUS_META[status] ?? STATUS_META.todo

  useEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuStyle(null)
      return undefined
    }

    function place() {
      const rect = triggerRef.current.getBoundingClientRect()
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 220),
        minWidth: Math.max(rect.width, 188),
        zIndex: 80,
      })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, pickingPercent])

  useEffect(() => {
    if (!open) return undefined

    function onPointerDown(event) {
      const inTrigger = rootRef.current?.contains(event.target)
      const inMenu = menuRef.current?.contains(event.target)
      if (!inTrigger && !inMenu) {
        setOpen(false)
        setPickingPercent(false)
      }
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        setPickingPercent(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function applyStatus(nextStatus, nextProgress) {
    setOpen(false)
    setPickingPercent(false)
    await onChange(task, { status: nextStatus, progress_percent: nextProgress })
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return
          setOpen((value) => !value)
          setPickingPercent(false)
        }}
        className={[
          'inline-flex min-w-[7.5rem] items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] transition',
          meta.className,
          disabled ? 'cursor-not-allowed opacity-60' : 'hover:brightness-110',
        ].join(' ')}
      >
        <span className="inline-flex items-center gap-1.5">
          {status === 'done' ? (
            <Check className="h-3 w-3" strokeWidth={2.5} />
          ) : status === 'in_progress' ? (
            <Loader2 className="h-3 w-3" strokeWidth={2.5} />
          ) : (
            <Circle className="h-3 w-3" strokeWidth={2.5} />
          )}
          {t(meta.labelKey)}
        </span>
        <span className="tabular-nums opacity-80">{progress}%</span>
      </button>

      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              style={menuStyle}
              className="overflow-hidden rounded-xl border border-white/10 bg-[#0e121b] shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
            >
              {!pickingPercent ? (
                <div className="p-1.5">
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-300 transition hover:bg-slate-800/80"
                    onClick={() => applyStatus('todo', 0)}
                  >
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    {t('status.todo')}
                    <span className="ml-auto text-[10px] text-slate-500">0%</span>
                  </button>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-amber-300 transition hover:bg-amber-500/10"
                    onClick={() => setPickingPercent(true)}
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    {t('status.in_progress')}
                    <span className="ml-auto text-[10px] text-amber-400/80">25–75%</span>
                  </button>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
                    onClick={() => applyStatus('done', 100)}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {t('status.done')}
                    <span className="ml-auto text-[10px] text-emerald-400/80">100%</span>
                  </button>
                </div>
              ) : (
                <div className="p-2">
                  <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {t('projects.planning.pickProgress')}
                  </p>
                  <div className="flex gap-1.5">
                    {IN_PROGRESS_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={[
                          'flex-1 rounded-lg border px-2 py-2 text-xs font-bold tabular-nums transition',
                          Number(progress) === preset
                            ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                            : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-amber-400/40 hover:text-amber-200',
                        ].join(' ')}
                        onClick={() => applyStatus('in_progress', preset)}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-2 w-full rounded-lg px-2 py-1.5 text-[11px] text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
                    onClick={() => setPickingPercent(false)}
                  >
                    {t('common.back')}
                  </button>
                </div>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export default function ProjectPhasesTasksPanel({
  phases,
  companyUsers,
  phaseName,
  setPhaseName,
  taskForms,
  setTaskForms,
  taskProgress,
  saving,
  canManagePhases,
  canManageProjectTask,
  locale,
  onAddPhase,
  onAddTask,
  onDeletePhase,
  onDeleteTask,
  onTaskStatusChange,
}) {
  const { t } = useTranslation()

  const phaseRows = useMemo(
    () =>
      phases.map((phase) => {
        const tasks = unwrapResource(phase.tasks)
        return {
          phase,
          tasks,
          progress: averagePhaseProgress(tasks, taskProgress),
        }
      }),
    [phases, taskProgress],
  )

  return (
    <section className="stack gap-4">
      {canManagePhases ? (
        <form
          className={`${BENTO_CARD_CLASS} flex flex-col gap-3 p-4 sm:flex-row sm:items-center`}
          onSubmit={onAddPhase}
        >
          <input
            className={`${FIELD_CLASS} flex-1`}
            placeholder={t('projects.planning.newPhase')}
            value={phaseName}
            onChange={(event) => setPhaseName(event.target.value)}
          />
          <NeonButton type="submit" size="sm" disabled={saving || !phaseName.trim()}>
            {t('projects.planning.addPhase')}
          </NeonButton>
        </form>
      ) : null}

      {phaseRows.length === 0 ? (
        <p className={`${BENTO_CARD_CLASS} p-5 text-sm text-slate-400`}>
          {t('projects.planning.noPhases')}
        </p>
      ) : null}

      {phaseRows.map(({ phase, tasks, progress }) => (
        <article key={phase.id} className={`${BENTO_CARD_CLASS} overflow-hidden`}>
          <header className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
            <div className="min-w-0 flex-1">
              <h3 className="m-0 text-sm font-bold text-white sm:text-base">{phase.name}</h3>
              <div className="mt-3 max-w-md space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="m-0 text-xs text-slate-400">
                    {t('projects.planning.phaseProgress', { percent: progress })}
                  </p>
                  <span className="text-[11px] font-semibold tabular-nums text-emerald-300">
                    {progress}%
                  </span>
                </div>
                <ProgressBar value={progress} tone={progress >= 100 ? 'done' : progress > 0 ? 'in_progress' : 'todo'} />
              </div>
            </div>
            {canManagePhases ? (
              <TrashIconButton
                label={t('projects.planning.deletePhase')}
                onClick={() => onDeletePhase(phase.id)}
                disabled={saving}
              />
            ) : null}
          </header>

          <ul className="m-0 list-none divide-y divide-white/[0.05] p-0">
            {tasks.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-slate-500 sm:px-5">
                {t('projects.planning.noTasks')}
              </li>
            ) : (
              tasks.map((task) => {
                const value = Number(taskProgress[task.id] ?? task.progress_percent ?? 0)
                const manageable = canManageProjectTask(task)
                const tone =
                  task.status === 'done' || value >= 100
                    ? 'done'
                    : task.status === 'in_progress' || value > 0
                      ? 'in_progress'
                      : 'todo'

                return (
                  <li key={task.id} className="px-4 py-3.5 sm:px-5">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <strong className="text-sm font-semibold text-white">{task.title}</strong>
                          {task.assigned_to ? (
                            <span className="text-xs text-slate-400">{task.assigned_to.full_name}</span>
                          ) : null}
                          {task.quantity != null && task.unit_price != null ? (
                            <span className="text-xs text-slate-500">
                              {task.quantity} {task.unit || 'u'} × {formatMoney(task.unit_price, locale)}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {manageable ? (
                            <TaskStatusControl
                              task={task}
                              progress={value}
                              disabled={saving}
                              onChange={onTaskStatusChange}
                              t={t}
                            />
                          ) : (
                            <span
                              className={[
                                'inline-flex rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em]',
                                (STATUS_META[tone] ?? STATUS_META.todo).className,
                              ].join(' ')}
                            >
                              {t((STATUS_META[tone] ?? STATUS_META.todo).labelKey)} · {value}%
                            </span>
                          )}
                          <div className="min-w-[8rem] flex-1 sm:max-w-xs">
                            <ProgressBar value={value} tone={tone} />
                          </div>
                        </div>
                      </div>

                      {manageable ? (
                        <TrashIconButton
                          label={t('common.delete')}
                          onClick={() => onDeleteTask(task.id)}
                          disabled={saving}
                        />
                      ) : null}
                    </div>
                  </li>
                )
              })
            )}
          </ul>

          {canManagePhases ? (
            <div className="flex flex-col gap-3 border-t border-white/[0.06] bg-[#0b0f17]/40 p-4 sm:flex-row sm:items-center sm:px-5">
              <input
                className={`${FIELD_CLASS} flex-1`}
                placeholder={t('projects.planning.newTask')}
                value={taskForms[phase.id]?.title ?? ''}
                onChange={(event) =>
                  setTaskForms({
                    ...taskForms,
                    [phase.id]: {
                      ...(taskForms[phase.id] ?? {}),
                      title: event.target.value,
                    },
                  })
                }
              />
              <div className="w-full sm:max-w-[14rem]">
                <CutSelect
                  className="w-full"
                  size="sm"
                  value={taskForms[phase.id]?.assigned_to_user_id ?? ''}
                  onChange={(assignedToUserId) =>
                    setTaskForms({
                      ...taskForms,
                      [phase.id]: {
                        ...(taskForms[phase.id] ?? { title: '' }),
                        assigned_to_user_id: assignedToUserId,
                      },
                    })
                  }
                  placeholder={t('projects.planning.unassigned')}
                  options={[
                    { value: '', label: t('projects.planning.unassigned') },
                    ...companyUsers.map((user) => ({
                      value: String(user.id),
                      label: user.full_name,
                    })),
                  ]}
                />
              </div>
              <NeonButton
                type="button"
                size="sm"
                disabled={saving || !(taskForms[phase.id]?.title ?? '').trim()}
                onClick={() => onAddTask(phase.id)}
              >
                {t('projects.planning.addTask')}
              </NeonButton>
            </div>
          ) : null}
        </article>
      ))}
    </section>
  )
}
