import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import ClientBadge from '../../components/ClientBadge'
import PermissionGate from '../../components/PermissionGate'
import { useTranslation } from '../../i18n/LanguageContext'
import * as badgesApi from '../../api/badges'
import { extractErrorMessage } from '../../utils/apiHelpers'

const emptyForm = {
  name: '',
  color: '#3B82F6',
}

export default function BadgeSettingsPanel() {
  const { t } = useTranslation()
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadBadges() {
    setLoading(true)
    setError('')

    try {
      const data = await badgesApi.fetchBadges()
      setBadges(data.data ?? [])
    } catch (err) {
      setError(extractErrorMessage(err, t('badges.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBadges()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(badge) {
    setEditing(badge)
    setForm({
      name: badge.name ?? '',
      color: badge.color ?? '#3B82F6',
    })
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editing) {
        await badgesApi.updateBadge(editing.id, form)
      } else {
        await badgesApi.createBadge(form)
      }

      setModalOpen(false)
      await loadBadges()
    } catch (err) {
      setError(extractErrorMessage(err, t('badges.saveError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(badge) {
    if (!window.confirm(t('badges.deleteConfirm', { name: badge.name }))) {
      return
    }

    try {
      await badgesApi.deleteBadge(badge.id)
      await loadBadges()
    } catch (err) {
      setError(extractErrorMessage(err, t('badges.deleteError')))
    }
  }

  return (
    <div className="badge-settings-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{t('badges.title')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('badges.subtitle')}</p>
        </div>
        <PermissionGate permission="role.manage">
          <button type="button" onClick={openCreate}>{t('badges.new')}</button>
        </PermissionGate>
      </div>

      {error ? <p className="error mt-4">{error}</p> : null}

      {loading ? (
        <p className="mt-6">{t('common.loading')}</p>
      ) : badges.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{t('badges.empty')}</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {badges.map((badge) => (
            <li
              key={badge.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-[#0f1013] px-4 py-3"
            >
              <ClientBadge name={badge.name} color={badge.color} />
              <PermissionGate permission="role.manage">
                <div className="flex items-center gap-2">
                  <button type="button" className="client-action-btn ghost" onClick={() => openEdit(badge)}>
                    {t('common.edit')}
                  </button>
                  <button type="button" className="client-action-btn ghost danger" onClick={() => handleDelete(badge)}>
                    {t('common.delete')}
                  </button>
                </div>
              </PermissionGate>
            </li>
          ))}
        </ul>
      )}

      <Modal
        title={editing ? t('badges.edit') : t('badges.new')}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            {t('badges.name')} *
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              maxLength={50}
            />
          </label>
          <label>
            {t('badges.color')} *
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value.toUpperCase() })}
                className="h-10 w-14 cursor-pointer rounded border border-slate-700 bg-transparent p-1"
              />
              <input
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                pattern="^#[0-9A-Fa-f]{6}$"
                required
                className="font-mono uppercase"
              />
              <ClientBadge name={form.name || t('badges.preview')} color={form.color} />
            </div>
          </label>
          <button type="submit" disabled={saving}>
            {saving ? t('common.saving') : editing ? t('badges.update') : t('badges.create')}
          </button>
        </form>
      </Modal>
    </div>
  )
}
