import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal'
import PermissionGate from '../../components/PermissionGate'
import CutFrame from '../../components/prodigy/CutFrame'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import { useTranslation } from '../../i18n/LanguageContext'
import * as lotsApi from '../../api/lots'
import * as sectorsApi from '../../api/sectors'
import { FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'

const emptySectorForm = { name: '' }

const emptyLotForm = {
  name: '',
  sector_id: '',
}

function IconLayers({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 3l9 5-9 5-9-5 9-5z" strokeLinejoin="round" />
      <path d="M3 12l9 5 9-5M3 16l9 5 9-5" strokeLinejoin="round" />
    </svg>
  )
}

function IconPlus({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
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
      <CutFrame size="lg" className="block" innerClassName="bg-[#0e131f] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('sectors.title')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('sectors.subtitle')}</p>
          </div>
          <PermissionGate permission="role.manage">
            <NeonButton type="button" size="sm" onClick={openCreateSector}>
              <IconPlus className="h-3.5 w-3.5" />
              {t('sectors.new')}
            </NeonButton>
          </PermissionGate>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-400">{t('common.loading')}</p>
        ) : sectors.length === 0 ? (
          <CutFrame size="md" className="mt-6 block" innerClassName="bg-[#0a0f18] px-5 py-10 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25">
              <IconLayers className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-300">{t('sectors.empty')}</p>
          </CutFrame>
        ) : (
          <ul className="mt-6 space-y-2.5">
            {sectors.map((sector) => (
              <li key={sector.id}>
                <CutFrame size="sm" className="block" innerClassName="bg-[#0a0f18] px-4 py-3.5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-emerald-400 ring-1 ring-white/[0.06]">
                        <IconLayers className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{sector.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {t('sectors.lotCount', { count: sector.lots_count ?? 0 })}
                        </p>
                      </div>
                    </div>
                    <PermissionGate permission="role.manage">
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <NeonButton type="button" variant="neon" size="sm" onClick={() => openCreateLot(sector.id)}>
                          <IconPlus className="h-3.5 w-3.5" />
                          {t('lots.newShort')}
                        </NeonButton>
                        <NeonButton type="button" variant="ghost" size="sm" onClick={() => openEditSector(sector)}>
                          {t('common.edit')}
                        </NeonButton>
                        <NeonButton type="button" variant="danger" size="sm" onClick={() => handleDeleteSector(sector)}>
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
      </CutFrame>

      <CutFrame size="lg" className="block" innerClassName="bg-[#0e131f] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('lots.title')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('lots.subtitle')}</p>
          </div>
          <PermissionGate permission="role.manage">
            <NeonButton
              type="button"
              size="sm"
              onClick={() => openCreateLot()}
              disabled={sectors.length === 0}
              className={sectors.length === 0 ? 'opacity-45' : ''}
            >
              <IconPlus className="h-3.5 w-3.5" />
              {t('lots.new')}
            </NeonButton>
          </PermissionGate>
        </div>

        {error ? <p className="error mt-4">{error}</p> : null}

        {loading ? (
          <p className="mt-6 text-sm text-slate-400">{t('common.loading')}</p>
        ) : lots.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">{t('lots.empty')}</p>
        ) : (
          <div className="mt-6 space-y-6">
            {groupedLots.map(({ sector, items }) => (
              items.length > 0 ? (
                <section key={sector.id}>
                  <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {sector.name}
                  </h3>
                  <ul className="space-y-2.5">
                    {items.map((lot) => (
                      <li key={lot.id}>
                        <CutFrame size="sm" className="block" innerClassName="bg-[#0a0f18] px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-sm font-medium text-slate-200">{lot.name}</span>
                            <PermissionGate permission="role.manage">
                              <div className="flex flex-wrap items-center gap-2">
                                <NeonButton type="button" variant="ghost" size="sm" onClick={() => openEditLot(lot)}>
                                  {t('common.edit')}
                                </NeonButton>
                                <NeonButton
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeleteLot(lot)}
                                >
                                  {t('common.delete')}
                                </NeonButton>
                              </div>
                            </PermissionGate>
                          </div>
                        </CutFrame>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null
            ))}
          </div>
        )}
      </CutFrame>

      <Modal
        title={editingSector ? t('sectors.edit') : t('sectors.new')}
        open={sectorModalOpen}
        onClose={() => setSectorModalOpen(false)}
      >
        <form className="stack" onSubmit={handleSectorSubmit}>
          <label className={LABEL_CLASS}>
            {t('sectors.name')} *
            <input
              className={FIELD_CLASS}
              value={sectorForm.name}
              onChange={(event) => setSectorForm({ name: event.target.value })}
              required
              maxLength={100}
            />
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <NeonButton type="button" variant="neon" size="sm" onClick={() => setSectorModalOpen(false)}>
              {t('common.cancel')}
            </NeonButton>
            <NeonButton type="submit" size="sm" disabled={saving} className={saving ? 'opacity-45' : ''}>
              {saving ? t('common.saving') : editingSector ? t('sectors.update') : t('sectors.create')}
            </NeonButton>
          </div>
        </form>
      </Modal>

      <Modal
        title={editingLot ? t('lots.edit') : t('lots.new')}
        open={lotModalOpen}
        onClose={() => setLotModalOpen(false)}
      >
        <form className="stack" onSubmit={handleLotSubmit}>
          <label className={LABEL_CLASS}>
            {t('lots.name')} *
            <input
              className={FIELD_CLASS}
              value={lotForm.name}
              onChange={(event) => setLotForm({ ...lotForm, name: event.target.value })}
              required
              maxLength={255}
            />
          </label>
          <label className={LABEL_CLASS}>
            {t('lots.sector')} *
            <CutSelect
              className="w-full"
              size="sm"
              value={lotForm.sector_id}
              onChange={(nextValue) => setLotForm({ ...lotForm, sector_id: nextValue })}
              placeholder={t('sectors.select')}
              options={[
                { value: '', label: t('sectors.select') },
                ...sectors.map((sector) => ({
                  value: String(sector.id),
                  label: sector.name,
                })),
              ]}
            />
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <NeonButton type="button" variant="neon" size="sm" onClick={() => setLotModalOpen(false)}>
              {t('common.cancel')}
            </NeonButton>
            <NeonButton
              type="submit"
              size="sm"
              disabled={saving || sectors.length === 0}
              className={saving || sectors.length === 0 ? 'opacity-45' : ''}
            >
              {saving ? t('common.saving') : editingLot ? t('lots.update') : t('lots.create')}
            </NeonButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
