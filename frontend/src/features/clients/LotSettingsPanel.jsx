import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal'
import PermissionGate from '../../components/PermissionGate'
import { useTranslation } from '../../i18n/LanguageContext'
import * as lotsApi from '../../api/lots'
import * as sectorsApi from '../../api/sectors'
import { extractErrorMessage } from '../../utils/apiHelpers'

const emptySectorForm = { name: '' }

const emptyLotForm = {
  name: '',
  sector_id: '',
}

export default function LotSettingsPanel() {
  const { t } = useTranslation()
  const [sectors, setSectors] = useState([])
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sectorModalOpen, setSectorModalOpen] = useState(false)
  const [lotModalOpen, setLotModalOpen] = useState(false)
  const [editingSector, setEditingSector] = useState(null)
  const [editingLot, setEditingLot] = useState(null)
  const [sectorForm, setSectorForm] = useState(emptySectorForm)
  const [lotForm, setLotForm] = useState(emptyLotForm)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [sectorsData, lotsData] = await Promise.all([
        sectorsApi.fetchSectors(),
        lotsApi.fetchLots(),
      ])
      setSectors(sectorsData.data ?? [])
      setLots(lotsData.data ?? [])
    } catch (err) {
      setError(extractErrorMessage(err, t('lots.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const groupedLots = useMemo(
    () => sectors.map((sector) => ({
      sector,
      items: lots.filter((lot) => lot.sector_id === sector.id),
    })),
    [sectors, lots],
  )

  function openCreateSector() {
    setEditingSector(null)
    setSectorForm(emptySectorForm)
    setSectorModalOpen(true)
  }

  function openEditSector(sector) {
    setEditingSector(sector)
    setSectorForm({ name: sector.name ?? '' })
    setSectorModalOpen(true)
  }

  function openCreateLot(sectorId = '') {
    setEditingLot(null)
    setLotForm({
      name: '',
      sector_id: sectorId ? String(sectorId) : String(sectors[0]?.id ?? ''),
    })
    setLotModalOpen(true)
  }

  function openEditLot(lot) {
    setEditingLot(lot)
    setLotForm({
      name: lot.name ?? '',
      sector_id: String(lot.sector_id ?? ''),
    })
    setLotModalOpen(true)
  }

  async function handleSectorSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editingSector) {
        await sectorsApi.updateSector(editingSector.id, sectorForm)
      } else {
        await sectorsApi.createSector(sectorForm)
      }

      setSectorModalOpen(false)
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err, t('sectors.saveError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleLotSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        name: lotForm.name,
        sector_id: Number(lotForm.sector_id),
      }

      if (editingLot) {
        await lotsApi.updateLot(editingLot.id, payload)
      } else {
        await lotsApi.createLot(payload)
      }

      setLotModalOpen(false)
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err, t('lots.saveError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteSector(sector) {
    if (!window.confirm(t('sectors.deleteConfirm', { name: sector.name }))) {
      return
    }

    try {
      await sectorsApi.deleteSector(sector.id)
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err, t('sectors.deleteError')))
    }
  }

  async function handleDeleteLot(lot) {
    if (!window.confirm(t('lots.deleteConfirm', { name: lot.name }))) {
      return
    }

    try {
      await lotsApi.deleteLot(lot.id)
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err, t('lots.deleteError')))
    }
  }

  return (
    <div className="lot-settings-panel space-y-8">
      <section className="rounded-xl border border-slate-800/80 bg-[#0f1013] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('sectors.title')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('sectors.subtitle')}</p>
          </div>
          <PermissionGate permission="role.manage">
            <button type="button" onClick={openCreateSector}>{t('sectors.new')}</button>
          </PermissionGate>
        </div>

        {loading ? (
          <p className="mt-6">{t('common.loading')}</p>
        ) : sectors.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">{t('sectors.empty')}</p>
        ) : (
          <ul className="mt-6 space-y-2">
            {sectors.map((sector) => (
              <li
                key={sector.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-[#0a0b0d]/40 px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-slate-200">{sector.name}</span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t('sectors.lotCount', { count: sector.lots_count ?? 0 })}
                  </p>
                </div>
                <PermissionGate permission="role.manage">
                  <div className="flex items-center gap-2">
                    <button type="button" className="client-action-btn ghost" onClick={() => openCreateLot(sector.id)}>
                      {t('lots.newShort')}
                    </button>
                    <button type="button" className="client-action-btn ghost" onClick={() => openEditSector(sector)}>
                      {t('common.edit')}
                    </button>
                    <button type="button" className="client-action-btn ghost danger" onClick={() => handleDeleteSector(sector)}>
                      {t('common.delete')}
                    </button>
                  </div>
                </PermissionGate>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('lots.title')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('lots.subtitle')}</p>
          </div>
          <PermissionGate permission="role.manage">
            <button type="button" onClick={() => openCreateLot()} disabled={sectors.length === 0}>
              {t('lots.new')}
            </button>
          </PermissionGate>
        </div>

        {error ? <p className="error mt-4">{error}</p> : null}

        {loading ? (
          <p className="mt-6">{t('common.loading')}</p>
        ) : lots.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">{t('lots.empty')}</p>
        ) : (
          <div className="mt-6 space-y-6">
            {groupedLots.map(({ sector, items }) => (
              items.length > 0 ? (
                <section key={sector.id}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{sector.name}</h3>
                  <ul className="space-y-2">
                    {items.map((lot) => (
                      <li
                        key={lot.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-[#0f1013] px-4 py-3"
                      >
                        <span className="text-sm text-slate-200">{lot.name}</span>
                        <PermissionGate permission="role.manage">
                          <div className="flex items-center gap-2">
                            <button type="button" className="client-action-btn ghost" onClick={() => openEditLot(lot)}>
                              {t('common.edit')}
                            </button>
                            <button type="button" className="client-action-btn ghost danger" onClick={() => handleDeleteLot(lot)}>
                              {t('common.delete')}
                            </button>
                          </div>
                        </PermissionGate>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null
            ))}
          </div>
        )}
      </section>

      <Modal
        title={editingSector ? t('sectors.edit') : t('sectors.new')}
        open={sectorModalOpen}
        onClose={() => setSectorModalOpen(false)}
      >
        <form className="stack" onSubmit={handleSectorSubmit}>
          <label>
            {t('sectors.name')} *
            <input
              value={sectorForm.name}
              onChange={(event) => setSectorForm({ name: event.target.value })}
              required
              maxLength={100}
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? t('common.saving') : editingSector ? t('sectors.update') : t('sectors.create')}
          </button>
        </form>
      </Modal>

      <Modal
        title={editingLot ? t('lots.edit') : t('lots.new')}
        open={lotModalOpen}
        onClose={() => setLotModalOpen(false)}
      >
        <form className="stack" onSubmit={handleLotSubmit}>
          <label>
            {t('lots.name')} *
            <input
              value={lotForm.name}
              onChange={(event) => setLotForm({ ...lotForm, name: event.target.value })}
              required
              maxLength={255}
            />
          </label>
          <label>
            {t('lots.sector')} *
            <select
              className="filter-select w-full"
              value={lotForm.sector_id}
              onChange={(event) => setLotForm({ ...lotForm, sector_id: event.target.value })}
              required
            >
              <option value="">{t('sectors.select')}</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={saving || sectors.length === 0}>
            {saving ? t('common.saving') : editingLot ? t('lots.update') : t('lots.create')}
          </button>
        </form>
      </Modal>
    </div>
  )
}
