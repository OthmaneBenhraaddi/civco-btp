export default function TaskViewTabs({ activeView, onChange, tabs }) {
  return (
    <div className="task-view-tabs mb-6 flex w-fit gap-1 rounded-xl border border-slate-800/80 bg-[#0f1013] p-1">
      {tabs.map(({ id, label }) => {
        const isActive = activeView === id

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={[
              'task-view-tab rounded-lg px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-in-out',
              isActive
                ? 'task-view-tab-active bg-blue-500/10 font-semibold text-blue-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
