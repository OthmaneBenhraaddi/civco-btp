import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PermissionGate from '../../components/PermissionGate'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import SearchInput from '../../components/SearchInput'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { resolveNavPath } from '../../routes/routeAccess'
import * as clientsApi from '../../api/clients'
import * as deliveryFormsApi from '../../api/deliveryForms'
import * as dispatchNotesApi from '../../api/dispatchNotes'
import * as projectsApi from '../../api/projects'
import { extractErrorMessage } from '../../utils/apiHelpers'

const emptyForm = {
  client_id: '',
  project_id: '',
  delivery_date: '',
  description: '',
  selectedPhaseIds: [],
}

export default function DeliveryFormsPage() {
  const { hasPermission, user } = useAuth()
  const { t } = useTranslation()
  const [forms, setForms] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [phases, setPhases] = useState([])
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selectedFormIds, setSelectedFormIds] = useState([])
  const [dispatchNotes, setDispatchNotes] = useState([])
  const [bundling, setBundling] = useState(false)
  const [executingNoteId, setExecutingNoteId] = useState(null)

  const clientProjects = useMemo(
    () => projects.filter((project) => String(project.client_id) === String(form.client_id)),
    [projects, form.client_id],
  )

  async function loadDispatchNotes() {
    try {
      const data = await dispatchNotesApi.fetchDispatchNotes({ per_page: 20 })
      setDispatchNotes(data.data ?? [])
    } catch {
      setDispatchNotes([])
    }
  }

  async function loadForms(page = 1) {
    setLoading(true)
    setError('')

    try {
      const data = await deliveryFormsApi.fetchDeliveryForms({
        search,
        status: statusFilter || undefined,
        page,
      })
      setForms(data.data ?? [])
      setMeta(data.meta ?? null)
    } catch (err) {
      setError(extractErrorMessage(err, t('deliveryForms.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForms()
    loadDispatchNotes()
  }, [search, statusFilter])

  useEffect(() => {
    clientsApi.fetchClients({ per_page: 100 })
      .then((data) => setClients(data.data ?? []))
      .catch(() => setClients([]))

    projectsApi.fetchProjects({ per_page: 100 })
      .then((data) => setProjects(data.data ?? []))
      .catch(() => setProjects([]))
  }, [])

  useEffect(() => {
    if (!form.project_id) {
      setPhases([])
      return
    }

    projectsApi.fetchProject(form.project_id)
      .then((data) => {
        const project = data.data ?? data
        setPhases(project.phases ?? [])
      })
      .catch(() => setPhases([]))
  }, [form.project_id])

  function openCreate() {
    setForm({
      ...emptyForm,
      client_id: clients[0]?.id ? String(clients[0].id) : '',
      delivery_date: new Date().toISOString().slice(0, 10),
    })
    setModalOpen(true)
  }

  function togglePhase(phaseId) {
    setForm((current) => {
      const selected = current.selectedPhaseIds.includes(phaseId)
        ? current.selectedPhaseIds.filter((id) => id !== phaseId)
        : [...current.selectedPhaseIds, phaseId]
      return { ...current, selectedPhaseIds: selected }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const lines = phases
      .filter((phase) => form.selectedPhaseIds.includes(phase.id))
      .map((phase) => ({
        description: phase.name,
        quantity: 1,
        project_phase_id: phase.id,
      }))

    if (lines.length === 0) {
      setError(t('deliveryForms.needLines'))
      setSaving(false)
      return
    }

    try {
      await deliveryFormsApi.createDeliveryForm({
        client_id: Number(form.client_id),
        project_id: form.project_id ? Number(form.project_id) : null,
        delivery_date: form.delivery_date || null,
        description: form.description || null,
        lines,
      })
      setModalOpen(false)
      await loadForms()
    } catch (err) {
      setError(extractErrorMessage(err, t('deliveryForms.createError')))
    } finally {
      setSaving(false)
    }
  }

  function toggleFormSelection(formId) {
    setSelectedFormIds((current) => (
      current.includes(formId)
        ? current.filter((id) => id !== formId)
        : [...current, formId]
    ))
  }

  function isBundlable(item) {
    return item.status === 'signed_and_stamped' && !item.dispatch_note_id
  }

  function resolveFormClientId(item) {
    return item.client_id ?? item.client?.id ?? null
  }

  async function handleBundleDispatchNote() {
    const selected = forms.filter((item) => selectedFormIds.includes(item.id))

    if (selected.length === 0) {
      setError(t('dispatchNotes.selectBl'))
      return
    }

    const clientIds = [...new Set(selected.map(resolveFormClientId).filter(Boolean))]

    if (clientIds.length !== 1) {
      setError(t('dispatchNotes.sameClientRequired'))
      return
    }

    setBundling(true)
    setError('')

    try {
      await dispatchNotesApi.createDispatchNote({
        client_id: Number(clientIds[0]),
        delivery_form_ids: selected.map((item) => item.id),
      })
      setSelectedFormIds([])
      await Promise.all([loadForms(meta?.current_page ?? 1), loadDispatchNotes()])
    } catch (err) {
      setError(extractErrorMessage(err, t('dispatchNotes.bundleError')))
    } finally {
      setBundling(false)
    }
  }

  async function handleExecuteDispatchNote(noteId) {
    if (!window.confirm(t('dispatchNotes.executeConfirm'))) {
      return
    }

    setExecutingNoteId(noteId)
    setError('')

    try {
      await dispatchNotesApi.executeDispatchNote(noteId)
      await loadDispatchNotes()
    } catch (err) {
      setError(extractErrorMessage(err, t('dispatchNotes.executeError')))
    } finally {
      setExecutingNoteId(null)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(t('deliveryForms.deleteConfirm', { reference: item.reference }))) {
      return
    }

    try {
      await deliveryFormsApi.deleteDeliveryForm(item.id)
      await loadForms(meta?.current_page ?? 1)
    } catch (err) {
      setError(extractErrorMessage(err, t('deliveryForms.deleteError')))
    }
  }

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <h1>{t('deliveryForms.title')}</h1>
          <p>{t('deliveryForms.subtitle')}</p>
        </div>
        <PermissionGate permission="delivery_form.manage">
          <div className="header-actions">
            {selectedFormIds.length > 0 ? (
              <button type="button" className="ghost" onClick={handleBundleDispatchNote} disabled={bundling}>
                {bundling ? t('dispatchNotes.bundling') : t('dispatchNotes.bundle', { count: selectedFormIds.length })}
              </button>
            ) : null}
            <button type="button" onClick={openCreate} disabled={clients.length === 0}>
              {t('deliveryForms.new')}
            </button>
          </div>
        </PermissionGate>
      </header>

      {clients.length === 0 ? (
        <p className="hint">{t('deliveryForms.needClient')}</p>
      ) : null}

      <div className="toolbar">
        <SearchInput
          placeholder={t('deliveryForms.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">{t('deliveryForms.allStatuses')}</option>
          <option value="draft">{t('status.draft')}</option>
          <option value="signed">{t('status.signed')}</option>
          <option value="signed_and_stamped">{t('status.signed_and_stamped')}</option>
        </select>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="select-col" />
                <th>{t('deliveryForms.reference')}</th>
                <th>{t('deliveryForms.project')}</th>
                <th>{t('deliveryForms.client')}</th>
                <th>{t('deliveryForms.deliveryDate')}</th>
                <th>{t('deliveryForms.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {forms.length === 0 ? (
                <tr>
                  <td colSpan={7}>{t('deliveryForms.empty')}</td>
                </tr>
              ) : (
                forms.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {hasPermission('delivery_form.manage') && isBundlable(item) ? (
                        <input
                          type="checkbox"
                          checked={selectedFormIds.includes(item.id)}
                          onChange={() => toggleFormSelection(item.id)}
                          aria-label={t('dispatchNotes.selectBlItem', { reference: item.reference })}
                        />
                      ) : null}
                    </td>
                    <td>
                      <Link to={resolveNavPath(`/delivery-forms/${item.id}`, user)}>{item.reference}</Link>
                    </td>
                    <td>{item.project?.title ?? '—'}</td>
                    <td>{item.client?.name ?? '—'}</td>
                    <td>{item.delivery_date ?? '—'}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td className="actions">
                      <Link to={resolveNavPath(`/delivery-forms/${item.id}`, user)} className="btn-action">{t('deliveryForms.open')}</Link>
                      {hasPermission('delivery_form.manage') && item.status === 'draft' ? (
                        <button type="button" className="ghost danger" onClick={() => handleDelete(item)}>
                          {t('common.delete')}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <section className="card mt-6">
        <header className="section-header">
          <div>
            <h2>{t('dispatchNotes.title')}</h2>
            <p className="hint">{t('dispatchNotes.subtitle')}</p>
          </div>
        </header>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('dispatchNotes.reference')}</th>
                <th>{t('deliveryForms.client')}</th>
                <th>{t('deliveryForms.status')}</th>
                <th>{t('dispatchNotes.blCount')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {dispatchNotes.length === 0 ? (
                <tr>
                  <td colSpan={5}>{t('dispatchNotes.empty')}</td>
                </tr>
              ) : (
                dispatchNotes.map((note) => (
                  <tr key={note.id}>
                    <td>{note.reference_number}</td>
                    <td>{note.client?.name ?? '—'}</td>
                    <td><StatusBadge status={note.status} /></td>
                    <td>{note.delivery_forms_count ?? 0}</td>
                    <td className="actions">
                      {hasPermission('delivery_form.manage') && note.status === 'draft' ? (
                        <button
                          type="button"
                          className="btn-action"
                          onClick={() => handleExecuteDispatchNote(note.id)}
                          disabled={executingNoteId === note.id}
                        >
                          {executingNoteId === note.id ? t('dispatchNotes.executing') : t('dispatchNotes.execute')}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal title={t('deliveryForms.new')} open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            {t('deliveryForms.client')} *
            <select
              value={form.client_id}
              onChange={(event) => setForm({
                ...form,
                client_id: event.target.value,
                project_id: '',
                selectedPhaseIds: [],
              })}
              required
            >
              <option value="">{t('deliveryForms.selectClient')}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>
          <label>
            {t('deliveryForms.project')}
            <select
              value={form.project_id}
              onChange={(event) => setForm({
                ...form,
                project_id: event.target.value,
                selectedPhaseIds: [],
              })}
            >
              <option value="">{t('deliveryForms.selectProject')}</option>
              {clientProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.reference} — {project.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('deliveryForms.deliveryDate')}
            <input
              type="date"
              value={form.delivery_date}
              onChange={(event) => setForm({ ...form, delivery_date: event.target.value })}
            />
          </label>
          <label>
            {t('deliveryForms.description')}
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          {form.project_id ? (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-300">{t('deliveryForms.selectPhases')}</p>
              {phases.length === 0 ? (
                <p className="text-xs text-slate-500">{t('deliveryForms.noPhases')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {phases.map((phase) => (
                    <label key={phase.id} className="checkbox flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.selectedPhaseIds.includes(phase.id)}
                        onChange={() => togglePhase(phase.id)}
                      />
                      <span>{phase.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{t('deliveryForms.selectProjectForPhases')}</p>
          )}
          <button type="submit" disabled={saving}>
            {saving ? t('deliveryForms.creating') : t('deliveryForms.create')}
          </button>
        </form>
      </Modal>
    </div>
  )
}
