import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import ClientBadge from '../../components/ClientBadge'
import PermissionGate from '../../components/PermissionGate'
import CutFrame from '../../components/prodigy/CutFrame'
import NeonButton from '../../components/prodigy/NeonButton'
import { useTranslation } from '../../i18n/LanguageContext'
import * as badgesApi from '../../api/badges'
import { FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'

const emptyForm = {
  name: '',
  color: '#3B82F6',
}

function IconPlus({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
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
          <NeonButton type="button" size="sm" onClick={openCreate}>
            <IconPlus className="h-3.5 w-3.5" />
            {t('badges.new')}
          </NeonButton>
        </PermissionGate>
      </div>

      {error ? <p className="error mt-4">{error}</p> : null}

      {loading ? (
        <p className="mt-6 text-sm text-slate-400">{t('common.loading')}</p>
      ) : badges.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{t('badges.empty')}</p>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {badges.map((badge) => (
            <li key={badge.id}>
              <CutFrame size="sm" className="block" innerClassName="bg-[#0e131f] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <ClientBadge name={badge.name} color={badge.color} />
                  <PermissionGate permission="role.manage">
                    <div className="flex flex-wrap items-center gap-2">
                      <NeonButton type="button" variant="ghost" size="sm" onClick={() => openEdit(badge)}>
                        {t('common.edit')}
                      </NeonButton>
                      <NeonButton type="button" variant="danger" size="sm" onClick={() => handleDelete(badge)}>
                        {t('common.delete')}
                      </NeonButton>
                    </div>
                  </PermissionGate>
                </div>
              </CutFrame>
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
          <label className={LABEL_CLASS}>
            {t('badges.name')} *
            <input
              className={FIELD_CLASS}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              maxLength={50}
            />
          </label>
          <label className={LABEL_CLASS}>
            {t('badges.color')} *
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value.toUpperCase() })}
                className="h-10 w-14 cursor-pointer rounded border border-slate-700 bg-transparent p-1"
              />
              <input
                className={`${FIELD_CLASS} max-w-[8rem] font-mono uppercase`}
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                pattern="^#[0-9A-Fa-f]{6}$"
                required
              />
              <ClientBadge name={form.name || t('badges.preview')} color={form.color} />
            </div>
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <NeonButton type="button" variant="neon" size="sm" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </NeonButton>
            <NeonButton type="submit" size="sm" disabled={saving} className={saving ? 'opacity-45' : ''}>
              {saving ? t('common.saving') : editing ? t('badges.update') : t('badges.create')}
            </NeonButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
