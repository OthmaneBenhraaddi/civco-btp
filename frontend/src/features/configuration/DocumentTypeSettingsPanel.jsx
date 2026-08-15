import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import PermissionGate from '../../components/PermissionGate'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import { useTranslation } from '../../i18n/LanguageContext'
import * as documentTypesApi from '../../api/documentTypes'
import { extractErrorMessage } from '../../utils/apiHelpers'

const emptyForm = {
  name: '',
  is_active: true,
}

export default function DocumentTypeSettingsPanel() {
  const { t } = useTranslation()
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [reassignModalOpen, setReassignModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deletingType, setDeletingType] = useState(null)
  const [reassignTo, setReassignTo] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadTypes() {
    setLoading(true)
    setError('')

    try {
      const data = await documentTypesApi.fetchDocumentTypes()
      setTypes(data.data ?? [])
    } catch (err) {
      setError(extractErrorMessage(err, t('documentTypes.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTypes()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(documentType) {
    setEditing(documentType)
    setForm({
      name: documentType.name ?? '',
      is_active: documentType.is_active !== false,
    })
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editing) {
        await documentTypesApi.updateDocumentType(editing.id, form)
      } else {
        await documentTypesApi.createDocumentType(form)
      }

      setModalOpen(false)
      await loadTypes()
    } catch (err) {
      setError(extractErrorMessage(err, t('documentTypes.saveError')))
    } finally {
      setSaving(false)
    }
  }

  function openDeleteFlow(documentType) {
    if ((documentType.documents_count ?? 0) > 0) {
      setDeletingType(documentType)
      setReassignTo('')
      setReassignModalOpen(true)
      return
    }

    confirmDelete(documentType.id)
  }

  async function confirmDelete(id, reassignTarget = null) {
    if (!reassignTarget && !window.confirm(t('documentTypes.deleteConfirm'))) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await documentTypesApi.deleteDocumentType(id, {
        reassignTo: reassignTarget ? Number(reassignTarget) : undefined,
      })
      setReassignModalOpen(false)
      setDeletingType(null)
      await loadTypes()
    } catch (err) {
      setError(extractErrorMessage(err, t('documentTypes.deleteError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleReassignDelete(event) {
    event.preventDefault()

    if (!deletingType || !reassignTo) {
      return
    }

    await confirmDelete(deletingType.id, reassignTo)
  }

  const reassignOptions = types.filter((item) => item.id !== deletingType?.id && item.is_active !== false)

  return (
    <PermissionGate permission="role.manage">
      <section className="card stack">
        <header className="card-header">
          <div>
            <h2>{t('documentTypes.title')}</h2>
            <p className="hint">{t('documentTypes.subtitle')}</p>
          </div>
          <NeonButton type="button" size="sm" onClick={openCreate}>
            <span aria-hidden>+</span>
            {t('documentTypes.new')}
          </NeonButton>
        </header>

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p>{t('common.loading')}</p> : null}

        {!loading && types.length === 0 ? (
          <p className="hint">{t('documentTypes.empty')}</p>
        ) : null}

        {!loading && types.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('documentTypes.name')}</th>
                  <th>{t('documentTypes.documentsCount')}</th>
                  <th>{t('documentTypes.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {types.map((documentType) => (
                  <tr key={documentType.id}>
                    <td>{documentType.name}</td>
                    <td>{documentType.documents_count ?? 0}</td>
                    <td>
                      {documentType.is_active === false
                        ? t('documentTypes.inactive')
                        : t('documentTypes.active')}
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        <NeonButton type="button" variant="ghost" size="sm" onClick={() => openEdit(documentType)}>
                          {t('common.edit')}
                        </NeonButton>
                        <NeonButton
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => openDeleteFlow(documentType)}
                        >
                          {t('common.delete')}
                        </NeonButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <Modal
        title={editing ? t('documentTypes.edit') : t('documentTypes.new')}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            {t('documentTypes.name')}
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
            />
            <span>{t('documentTypes.activeHint')}</span>
          </label>
          <p className="hint">{t('documentTypes.inactiveHint')}</p>
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <NeonButton type="button" variant="neon" size="sm" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </NeonButton>
            <NeonButton type="submit" size="sm" disabled={saving} className={saving ? 'opacity-45' : ''}>
              {saving ? t('common.saving') : editing ? t('common.save') : t('documentTypes.create')}
            </NeonButton>
          </div>
        </form>
      </Modal>

      <Modal
        title={t('documentTypes.reassignTitle')}
        open={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
      >
        <form className="stack" onSubmit={handleReassignDelete}>
          <p className="hint">
            {t('documentTypes.reassignBody', {
              name: deletingType?.name ?? '',
              count: deletingType?.documents_count ?? 0,
            })}
          </p>
          <label>
            {t('documentTypes.reassignTarget')}
            <CutSelect
              className="w-full"
              size="sm"
              value={reassignTo}
              onChange={setReassignTo}
              required
              placeholder={t('documentTypes.reassignSelect')}
              options={[
                { value: '', label: t('documentTypes.reassignSelect') },
                ...reassignOptions.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
            />
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <NeonButton type="button" variant="neon" size="sm" onClick={() => setReassignModalOpen(false)}>
              {t('common.cancel')}
            </NeonButton>
            <NeonButton
              type="submit"
              variant="danger"
              size="sm"
              disabled={saving || !reassignTo}
              className={saving || !reassignTo ? 'opacity-45' : ''}
            >
              {t('documentTypes.reassignAndDelete')}
            </NeonButton>
          </div>
        </form>
      </Modal>
    </PermissionGate>
  )
}
