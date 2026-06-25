import TaskStatusBadge from './TaskStatusBadge'
import { STATUT_I18N_KEY } from '../types'

function MetricCard({ label, value, accent }) {
  return (
    <article className={`rounded-xl border p-5 shadow-lg shadow-black/20 ${accent}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
    </article>
  )
}

function ProgressBar({ label, count, total, colorClass }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-300">{label}</span>
        <span className="font-mono text-zinc-400">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function TaskDashboardView({ tasks, t }) {
  const total = tasks.length
  const done = tasks.filter((task) => task.statut === 'termine').length
  const working = tasks.filter((task) => task.statut === 'en_cours').length
  const stuck = tasks.filter((task) => task.statut === 'bloque').length
  const notStarted = tasks.filter((task) => task.statut === 'non_commence').length

  const byOwner = tasks.reduce((acc, task) => {
    acc[task.responsable.name] = (acc[task.responsable.name] ?? 0) + 1
    return acc
  }, {})

  const ownerEntries = Object.entries(byOwner).sort((a, b) => b[1] - a[1])
  const maxOwnerCount = ownerEntries[0]?.[1] ?? 1

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('tasks.metrics.all')}
          value={total}
          accent="border-gray-800 bg-[#16171B]"
        />
        <MetricCard
          label={t('tasks.metrics.done')}
          value={done}
          accent="border-emerald-900/50 bg-emerald-950/30"
        />
        <MetricCard
          label={t('tasks.metrics.inProgress')}
          value={working}
          accent="border-amber-900/50 bg-amber-950/20"
        />
        <MetricCard
          label={t('tasks.metrics.stuck')}
          value={stuck}
          accent="border-rose-900/50 bg-rose-950/20"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-gray-800 bg-[#16171B] p-6 shadow-xl shadow-black/25">
          <h3 className="mb-5 text-base font-semibold text-zinc-100">{t('tasks.widgets.byStatus')}</h3>
          <div className="space-y-4">
            <ProgressBar
              label={t('tasks.statuses.working')}
              count={working}
              total={total}
              colorClass="bg-amber-500"
            />
            <ProgressBar label={t('tasks.statuses.done')} count={done} total={total} colorClass="bg-emerald-500" />
            <ProgressBar label={t('tasks.statuses.stuck')} count={stuck} total={total} colorClass="bg-rose-500" />
            <ProgressBar
              label={t('tasks.statuses.not_started')}
              count={notStarted}
              total={total}
              colorClass="bg-zinc-500"
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              ['en_cours', working],
              ['termine', done],
              ['bloque', stuck],
              ['non_commence', notStarted],
            ].map(([statut, count]) => (
              <div key={statut} className="flex items-center gap-2 rounded-lg bg-zinc-900/80 px-3 py-2 ring-1 ring-gray-800">
                <TaskStatusBadge status={statut} label={t(`tasks.statuses.${STATUT_I18N_KEY[statut]}`)} />
                <span className="font-mono text-sm text-zinc-300">{count}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-gray-800 bg-[#16171B] p-6 shadow-xl shadow-black/25">
          <h3 className="mb-5 text-base font-semibold text-zinc-100">{t('tasks.widgets.byOwner')}</h3>
          {ownerEntries.length === 0 ? (
            <p className="text-sm text-zinc-500">{t('tasks.empty')}</p>
          ) : (
            <ul className="space-y-4">
              {ownerEntries.map(([name, count]) => (
                <li key={name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-200">{name}</span>
                    <span className="font-mono text-zinc-400">
                      {count} {count === 1 ? t('tasks.taskSingular') : t('tasks.taskPlural')}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500"
                      style={{ width: `${(count / maxOwnerCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  )
}
