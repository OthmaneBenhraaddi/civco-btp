import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../../../components/Modal'
import { useTranslation } from '../../../i18n/LanguageContext'
import * as lotsApi from '../../../api/lots'
import * as sectorsApi from '../../../api/sectors'
import { extractErrorMessage } from '../../../utils/apiHelpers'
import {
  DEFAULT_PROJECT_FORM,
  PAYMENT_STATES,
  PROJECT_SECTORS,
} from '../constants/projectFormConfig'

const LABEL_CLASS = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400'
const FIELD_CLASS =
  'w-full rounded-lg border border-slate-700/60 bg-[#111827] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600/50'

function SegmentOption({ active, children, onClick, name }) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        checked={active}
        onChange={onClick}
        className="peer sr-only"
      />
      <span
        className={[
          'inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
          active
            ? 'bg-slate-700 text-white shadow-sm'
            : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
        ].join(' ')}
      >
        {children}
      </span>
    </label>
  )
}

export default function NewProjectModal({
  open,
  onClose,
  clients,
  onSubmit,
  saving = false,
}) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState(DEFAULT_PROJECT_FORM)
  const [documents, setDocuments] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [sectors, setSectors] = useState([])
  const [availableLots, setAvailableLots] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')

  const groupedLots = useMemo(
    () => sectors.map((sector) => ({
      sector,
      items: availableLots.filter((lot) => lot.sector_id === sector.id),
    })).filter((group) => group.items.length > 0),
    [sectors, availableLots],
  )

  const activeLots = useMemo(
    () => availableLots.filter((lot) => String(lot.sector_id) === String(form.selectedSectorId)),
    [availableLots, form.selectedSectorId],
  )

  const selectedSector = useMemo(
    () => sectors.find((sector) => String(sector.id) === String(form.selectedSectorId)) ?? null,
    [sectors, form.selectedSectorId],
  )

  useEffect(() => {
    if (!open) return

    setForm({
      ...DEFAULT_PROJECT_FORM,
      client_id: clients[0]?.id ? String(clients[0].id) : '',
    })
    setDocuments([])
    setIsDragging(false)
    setCatalogError('')
  }, [open, clients])

  useEffect(() => {
    if (!open) return

    async function loadCatalog() {
      setCatalogLoading(true)
      setCatalogError('')

      try {
        const [sectorsData, lotsData] = await Promise.all([
          sectorsApi.fetchSectors(),
          lotsApi.fetchLots(),
        ])
        const nextSectors = sectorsData.data ?? []
        const nextLots = lotsData.data ?? []
        setSectors(nextSectors)
        setAvailableLots(nextLots)
        setForm((current) => ({
          ...current,
          selectedSectorId: current.selectedSectorId || String(nextSectors[0]?.id ?? ''),
        }))
      } catch (err) {
        setSectors([])
        setAvailableLots([])
        setCatalogError(extractErrorMessage(err, t('lots.loadError')))
      } finally {
        setCatalogLoading(false)
      }
    }

    loadCatalog()
  }, [open, t])

  function updateForm(patch) {
    setForm((current) => ({ ...current, ...patch }))
  }

  function handleSectorChange(selectedSectorId) {
    const allowedIds = availableLots
      .filter((lot) => String(lot.sector_id) === String(selectedSectorId))
      .map((lot) => lot.id)

    updateForm({
      selectedSectorId,
      selectedLotIds: form.selectedLotIds.filter((id) => allowedIds.includes(id)),
    })
  }

  function toggleLot(lotId) {
    setForm((current) => {
      const selected = current.selectedLotIds.includes(lotId)
        ? current.selectedLotIds.filter((id) => id !== lotId)
        : [...current.selectedLotIds, lotId]
      return { ...current, selectedLotIds: selected }
    })
  }

  function addFiles(fileList) {
    if (!fileList?.length) return
    setDocuments((current) => [...current, ...Array.from(fileList)])
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    addFiles(event.dataTransfer.files)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const documentMeta = documents.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }))
    const selectedLotNames = availableLots
      .filter((lot) => form.selectedLotIds.includes(lot.id))
      .map((lot) => lot.name)

    await onSubmit({
      ...form,
      documentMeta,
      selectedLotNames,
      sectorName: selectedSector?.name ?? null,
      sectors,
    })
  }

  return (
    <Modal
      title={t('projects.new')}
      open={open}
      onClose={onClose}
      panelClassName="new-project-modal w-full max-w-2xl border-slate-700/60 bg-[#1f2937] text-white"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className={LABEL_CLASS}>{t('projects.form.client')}</span>
            <select
              className={FIELD_CLASS}
              value={form.client_id}
              onChange={(event) => updateForm({ client_id: event.target.value })}
              required
            >
              <option value="">{t('projects.selectClient')}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={LABEL_CLASS}>{t('projects.form.workSector')}</span>
            <select
              className={FIELD_CLASS}
              value={form.selectedSectorId}
              onChange={(event) => handleSectorChange(event.target.value)}
              required
              disabled={catalogLoading || sectors.length === 0}
            >
              <option value="">{t('sectors.select')}</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={LABEL_CLASS}>{t('projects.form.paymentState')}</span>
            <select
              className={FIELD_CLASS}
              value={form.etatPaiement}
              onChange={(event) => updateForm({ etatPaiement: event.target.value })}
              required
            >
              {PAYMENT_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className={LABEL_CLASS}>{t('projects.form.objet')}</span>
            <input
              className={FIELD_CLASS}
              value={form.objet}
              onChange={(event) => updateForm({ objet: event.target.value })}
              placeholder={t('projects.form.objetPlaceholder')}
              required
            />
          </label>

          <label>
            <span className={LABEL_CLASS}>{t('projects.form.amount')}</span>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                className={`${FIELD_CLASS} pr-14`}
                value={form.montant}
                onChange={(event) => updateForm({ montant: event.target.value })}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase text-slate-500">
                MAD
              </span>
            </div>
          </label>

          <label>
            <span className={LABEL_CLASS}>{t('projects.form.delays')}</span>
            <input
              className={FIELD_CLASS}
              value={form.delais}
              onChange={(event) => updateForm({ delais: event.target.value })}
              placeholder={t('projects.form.delaysPlaceholder')}
            />
          </label>

          <label>
            <span className={LABEL_CLASS}>{t('projects.form.serviceOrderDate')}</span>
            <input
              type="date"
              className={FIELD_CLASS}
              value={form.ordreServiceDate}
              onChange={(event) => updateForm({ ordreServiceDate: event.target.value })}
            />
          </label>

          <label>
            <span className={LABEL_CLASS}>{t('projects.form.endDate')}</span>
            <input
              type="date"
              className={FIELD_CLASS}
              value={form.dateFinTravaux}
              onChange={(event) => updateForm({ dateFinTravaux: event.target.value })}
            />
          </label>

          <label className="md:col-span-2">
            <span className={LABEL_CLASS}>{t('projects.form.progression')}</span>
            <input
              className={FIELD_CLASS}
              value={form.avancement}
              onChange={(event) => updateForm({ avancement: event.target.value })}
            />
          </label>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-[#111827]/40 p-4">
          <p className={LABEL_CLASS}>{t('projects.form.siteLocationTitle')}</p>
          <p className="mb-3 text-xs leading-relaxed text-slate-500">
            {t('projects.form.siteLocationHint')}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className={LABEL_CLASS}>{t('projects.form.siteAddressLine1')}</span>
              <input
                className={FIELD_CLASS}
                value={form.site_address_line1}
                onChange={(event) => updateForm({ site_address_line1: event.target.value })}
                placeholder={t('projects.form.siteAddressLine1Placeholder')}
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>{t('projects.form.siteCity')}</span>
              <input
                className={FIELD_CLASS}
                value={form.site_city}
                onChange={(event) => updateForm({ site_city: event.target.value })}
                placeholder={t('projects.form.siteCityPlaceholder')}
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>{t('projects.form.sitePostalCode')}</span>
              <input
                className={FIELD_CLASS}
                value={form.site_postal_code}
                onChange={(event) => updateForm({ site_postal_code: event.target.value })}
                placeholder={t('projects.form.sitePostalCodePlaceholder')}
              />
            </label>
          </div>
        </div>

        <div>
          <span className={LABEL_CLASS}>{t('projects.form.sector')}</span>
          <div className="mt-2 inline-flex rounded-xl border border-slate-700/60 bg-[#111827] p-1">
            {PROJECT_SECTORS.map((sector) => (
              <SegmentOption
                key={sector}
                name="project-sector"
                active={form.sector === sector}
                onClick={() => updateForm({ sector })}
              >
                {sector}
              </SegmentOption>
            ))}
          </div>
        </div>

        <div>
          <span className={LABEL_CLASS}>
            {selectedSector
              ? t('projects.form.lotsForSector', { sector: selectedSector.name })
              : t('projects.form.lots')}
          </span>
          {catalogError ? <p className="mt-2 text-xs text-red-400">{catalogError}</p> : null}
          {catalogLoading ? (
            <p className="mt-2 text-xs text-slate-500">{t('common.loading')}</p>
          ) : sectors.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">{t('sectors.empty')}</p>
          ) : activeLots.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">{t('projects.form.noLotsAvailable')}</p>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-2 rounded-xl bg-[#111827] p-3 text-xs text-slate-300 md:grid-cols-2">
              {activeLots.map((lot) => {
                const checked = form.selectedLotIds.includes(lot.id)
                return (
                  <label
                    key={lot.id}
                    className={[
                      'flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 transition-colors',
                      checked
                        ? 'border-slate-600/60 bg-slate-700/40 text-white'
                        : 'border-transparent hover:bg-white/[0.03]',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLot(lot.id)}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-600 bg-[#111827] text-slate-400 focus:ring-slate-500"
                    />
                    <span className="leading-snug">{lot.name}</span>
                  </label>
                )
              })}
            </div>
          )}

          {groupedLots.length > 1 ? (
            <div className="mt-4 space-y-4 rounded-xl border border-slate-800/60 bg-[#0f1013]/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {t('projects.form.allSectorsOverview')}
              </p>
              {groupedLots.map(({ sector, items }) => (
                <div key={sector.id}>
                  <p className="text-xs font-semibold text-slate-400">{sector.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {items.map((lot) => lot.name).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <span className={LABEL_CLASS}>{t('projects.form.documentsTitle')}</span>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              'mt-2 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors',
              isDragging
                ? 'border-slate-500 bg-slate-800/50'
                : 'border-slate-700/60 bg-[#111827]/60 hover:border-slate-600/60 hover:bg-[#111827]',
            ].join(' ')}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => addFiles(event.target.files)}
            />
            <p className="text-sm font-semibold text-white">{t('projects.form.documentsTitle')}</p>
            <p className="mt-1 text-xs text-slate-500">{t('projects.form.documentsHint')}</p>
            {documents.length > 0 ? (
              <ul className="mt-3 space-y-1 text-left text-xs text-slate-400">
                {documents.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="truncate">
                    {file.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-700/50 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="new-project-modal-btn rounded-xl border border-slate-700/60 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving || !form.selectedSectorId}
            className="new-project-modal-btn rounded-xl border border-slate-600/60 bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-600 disabled:opacity-60"
          >
            {saving ? t('projects.creating') : t('projects.create')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
