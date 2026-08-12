export default function TaskViewTabs({ activeView, onChange, tabs }) {
  return (
    <div className="task-view-tabs mb-6 flex w-fit flex-wrap gap-2">
      {tabs.map(({ id, label }) => {
        const isActive = activeView === id

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`pg-filter ${isActive ? 'is-active' : ''}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
