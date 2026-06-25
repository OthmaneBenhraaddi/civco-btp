import { useCallback, useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../context/ToastContext'
import { useTranslation } from '../../../i18n/LanguageContext'
import { FIELD_CLASS } from '../../../theme/designTokens'
import {
  DAILY_SCHEDULE_EVENT,
  addDailyScheduleItem,
  readDailySchedule,
  removeDailyScheduleItem,
  tagColorFor,
  updateDailyScheduleItem,
} from '../dailyScheduleStore'
import { DASHBOARD_CARD_CLASS } from '../dashboardTheme'

const EMPTY_FORM = { time: '09:00', title: '', tag: 'chantier' }

function IconPlus({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10 4v12M4 10h12" strokeLinecap="round" />
    </svg>
  )
}

function IconPencil({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M13.5 3.5l3 3-9 9H4.5v-3l9-9z" strokeLinejoin="round" />
    </svg>
  )
}

function IconTrash({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 6h12M7 6V4.5h6V6M8 9v5M12 9v5M5.5 6l.5 10h8l.5-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function DailyScheduleFeed() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const { pushToast } = useToast()
  const [items, setItems] = useState(() => readDailySchedule())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const refresh = useCallback(() => {
    setItems(readDailySchedule())
  }, [])

  useEffect(() => {
    function handleUpdate() {
      refresh()
    }

    window.addEventListener(DAILY_SCHEDULE_EVENT, handleUpdate)
    return () => window.removeEventListener(DAILY_SCHEDULE_EVENT, handleUpdate)
  }, [refresh])

  function openAddModal() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEditModal(item) {
    setEditingId(item.id)
    setForm({ time: item.time, title: item.title, tag: item.tag })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) return

    if (editingId) {
      updateDailyScheduleItem(editingId, form)
    } else {
      addDailyScheduleItem(form)
      pushToast({
        action: 'creation',
        message: t('dashboard.schedule.toast.added', { title: form.title.trim() }),
      })
    }

    closeModal()
  }

  function handleRemove(id) {
    const removed = removeDailyScheduleItem(id)

    if (removed) {
      pushToast({
        action: 'suppression',
        message: t('dashboard.schedule.toast.removed', { title: removed.title }),
      })
    }
  }

  return (
    <>
      <article className={`p-5 ${DASHBOARD_CARD_CLASS}`}>
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">{t('dashboard.dailySchedule')}</h3>
          {isAdmin ? (
            <button
              type="button"
              onClick={openAddModal}
              className="daily-schedule-add-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/[0.08] text-white shadow-sm transition-colors hover:border-white/30 hover:bg-white/[0.12]"
              aria-label={t('dashboard.schedule.addItem')}
              title={t('dashboard.schedule.addItem')}
            >
              <IconPlus className="h-4 w-4" />
            </button>
          ) : null}
        </header>

        {items.length === 0 ? (
          <p className="text-sm text-slate-500">{t('dashboard.schedule.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((event) => (
              <li
                key={event.id}
                className="group relative rounded-xl border border-white/[0.06] bg-[#121316]/60 px-3.5 py-3 transition hover:border-white/10 hover:bg-[#121316]"
              >
                <div className="flex items-start gap-3">
                  <time className="shrink-0 pt-0.5 text-xs font-bold tabular-nums text-gray-400">
                    {event.time}
                  </time>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{event.title}</p>
                    <span
                      className={[
                        'mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        tagColorFor(event.tag),
                      ].join(' ')}
                    >
                      {t(`dashboard.schedule.tags.${event.tag}`)}
                    </span>
                  </div>
                  {isAdmin ? (
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => openEditModal(event)}
                        className="daily-schedule-item-btn rounded-md p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-white"
                        aria-label={t('common.edit')}
                      >
                        <IconPencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(event.id)}
                        className="daily-schedule-item-btn rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                        aria-label={t('common.delete')}
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? t('dashboard.schedule.editItem') : t('dashboard.schedule.addItem')}
        panelClassName="max-w-md"
      >
        <form className="stack" onSubmit={handleSubmit}>
          <label className="form-row">
            <span>{t('dashboard.schedule.fields.time')}</span>
            <input
              type="time"
              className={FIELD_CLASS}
              value={form.time}
              onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
              required
            />
          </label>

          <label className="form-row">
            <span>{t('dashboard.schedule.fields.title')}</span>
            <input
              type="text"
              className={FIELD_CLASS}
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder={t('dashboard.schedule.fields.titlePlaceholder')}
              required
            />
          </label>

          <label className="form-row">
            <span>{t('dashboard.schedule.fields.tag')}</span>
            <select
              className={FIELD_CLASS}
              value={form.tag}
              onChange={(event) => setForm((current) => ({ ...current, tag: event.target.value }))}
            >
              <option value="chantier">{t('dashboard.schedule.tags.chantier')}</option>
              <option value="validation">{t('dashboard.schedule.tags.validation')}</option>
              <option value="inspection">{t('dashboard.schedule.tags.inspection')}</option>
              <option value="finance">{t('dashboard.schedule.tags.finance')}</option>
            </select>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="ghost" onClick={closeModal}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary">
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
