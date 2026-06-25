import { useMemo, useState } from 'react'
import RoleBadge from '../../components/RoleBadge'
import Modal from '../../components/Modal'
import SearchInput from '../../components/SearchInput'
import { useTranslation } from '../../i18n/LanguageContext'
import * as clientContactsApi from '../../api/clientContacts'
import { extractErrorMessage } from '../../utils/apiHelpers'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  contact_role: 'commercial',
}

export default function ClientContactsPanel({
  clientId,
  contacts = [],
  onContactsChange,
  canManage,
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return contacts
    }

    return contacts.filter((contact) => {
      const roleLabel = t(`clientContacts.roles.${contact.contact_role}`)
      return [
        contact.name,
        contact.email,
        contact.phone,
        roleLabel,
      ].some((value) => value?.toLowerCase().includes(query))
    })
  }, [contacts, search, t])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  function openEdit(contact) {
    setEditing(contact)
    setForm({
      name: contact.name ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      contact_role: contact.contact_role ?? 'commercial',
    })
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editing) {
        await clientContactsApi.updateClientContact(editing.id, form)
      } else {
        await clientContactsApi.createClientContact(clientId, form)
      }

      setModalOpen(false)
      await onContactsChange()
    } catch (err) {
      setError(extractErrorMessage(err, t('clientContacts.saveError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(contact) {
    if (!window.confirm(t('clientContacts.deleteConfirm', { name: contact.name }))) {
      return
    }

    try {
      await clientContactsApi.deleteClientContact(contact.id)
      await onContactsChange()
    } catch (err) {
      setError(extractErrorMessage(err, t('clientContacts.deleteError')))
    }
  }

  return (
    <div className="rounded-xl border border-slate-800/60 bg-[#0a0b0d]/60 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{t('clientContacts.title')}</h3>
          <p className="mt-1 text-xs text-slate-500">{t('clientContacts.subtitle')}</p>
        </div>
        {canManage ? (
          <button type="button" className="client-action-btn" onClick={openCreate}>
            {t('clientContacts.add')}
          </button>
        ) : null}
      </div>

      <SearchInput
        placeholder={t('clientContacts.search')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {error ? <p className="error mt-3">{error}</p> : null}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800/50">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800/50 bg-[#111827]/50 text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5">{t('clientContacts.name')}</th>
              <th className="px-3 py-2.5">{t('clientContacts.email')}</th>
              <th className="px-3 py-2.5">{t('clientContacts.phone')}</th>
              <th className="px-3 py-2.5">{t('clientContacts.role')}</th>
              {canManage ? <th className="px-3 py-2.5">{t('common.actions')}</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="px-3 py-8 text-center text-xs text-slate-500">
                  {search ? t('clientContacts.noResults') : t('clientContacts.empty')}
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact) => (
                <tr key={contact.id} className="border-b border-slate-800/30 last:border-0">
                  <td className="px-3 py-3 font-medium text-slate-200">{contact.name}</td>
                  <td className="px-3 py-3 text-slate-400">{contact.email || '—'}</td>
                  <td className="px-3 py-3 text-slate-400">{contact.phone || '—'}</td>
                  <td className="px-3 py-3">
                    <RoleBadge
                      label={t(`clientContacts.roles.${contact.contact_role}`)}
                      tone={clientContactsApi.CONTACT_ROLE_TONES[contact.contact_role] ?? 'slate'}
                    />
                  </td>
                  {canManage ? (
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button type="button" className="ghost" onClick={() => openEdit(contact)}>
                          {t('common.edit')}
                        </button>
                        <button type="button" className="ghost danger" onClick={() => handleDelete(contact)}>
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={editing ? t('clientContacts.edit') : t('clientContacts.add')}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form className="stack" onSubmit={handleSubmit}>
          <label className="grid gap-1.5">
            {t('clientContacts.name')}
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label className="grid gap-1.5">
            {t('clientContacts.email')}
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label className="grid gap-1.5">
            {t('clientContacts.phone')}
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>
          <label className="grid gap-1.5">
            {t('clientContacts.role')}
            <select
              value={form.contact_role}
              onChange={(event) => setForm({ ...form, contact_role: event.target.value })}
            >
              {clientContactsApi.CONTACT_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {t(`clientContacts.roles.${role}`)}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </form>
      </Modal>
    </div>
  )
}
