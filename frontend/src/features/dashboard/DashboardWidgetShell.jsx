import { useTranslation } from '../../i18n/LanguageContext'
import { DASHBOARD_WIDGET_LAYOUT } from './dashboardLayoutStore'

function DragHandleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M7 4a1 1 0 100-2 1 1 0 000 2zm6-1a1 1 0 11-2 0 1 1 0 012 0zM7 11a1 1 0 100-2 1 1 0 000 2zm6-1a1 1 0 11-2 0 1 1 0 012 0zM7 18a1 1 0 100-2 1 1 0 000 2zm6-1a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  )
}

export default function DashboardWidgetShell({
  widgetId,
  editMode,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  children,
}) {
  const { t } = useTranslation()
  const layout = DASHBOARD_WIDGET_LAYOUT[widgetId]
  const label = t(`dashboard.widgets.${widgetId}`)

  return (
    <div
      className={[
        layout?.colSpan ?? 'col-span-12',
        'dashboard-widget min-w-0 transition-shadow duration-200',
        editMode ? 'dashboard-widget--edit rounded-2xl' : '',
        isDragging ? 'dashboard-widget--dragging opacity-60' : '',
        isDropTarget ? 'dashboard-widget--drop-target' : '',
      ].join(' ')}
      onDragOver={editMode ? onDragOver : undefined}
      onDragLeave={editMode ? onDragLeave : undefined}
      onDrop={editMode ? onDrop : undefined}
    >
      {editMode ? (
        <div
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="dashboard-widget__handle"
          aria-label={t('dashboard.dragHandle', { widget: label })}
        >
          <DragHandleIcon className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        </div>
      ) : null}
      <div className={editMode ? 'dashboard-widget__content' : 'h-full'}>
        {children}
      </div>
    </div>
  )
}
