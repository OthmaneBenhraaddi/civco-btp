import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import Modal from '../../../components/Modal'
import WizardProgress from '../../../components/wizard/WizardProgress'
import { SectorCard, TypeCard } from '../../../components/wizard/wizardCards'
import { useTranslation } from '../../../i18n/LanguageContext'
import * as lotsApi from '../../../api/lots'
import * as sectorsApi from '../../../api/sectors'
import { extractErrorMessage } from '../../../utils/apiHelpers'
import {
  BTN_GHOST,
  BTN_PRIMARY,
  FIELD_CLASS,
  LABEL_CLASS,
} from '../../../theme/designTokens'
import {
  DEFAULT_PROJECT_FORM,
  PAYMENT_STATES,
  PROJECT_SECTORS,
} from '../constants/projectFormConfig'

const WIZARD_STEPS = ['general', 'classification', 'pricing']

export default function NewProjectModal({
  open,
  onClose,
  clients,
  onSubmit,
  saving = false,
}) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(DEFAULT_PROJECT_FORM)
  const [documents, setDocuments] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [sectors, setSectors] = useState([])
  const [availableLots, setAvailableLots] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')

  const stepLabels = [
    t('projects.wizard.stepGeneral'),
    t('projects.wizard.stepClassification'),
    t('projects.wizard.stepPricing'),
  ]

  const activeLots = useMemo(
    () => availableLots.filter((lot) => String(lot.sector_id) === String(form.selectedSectorId)),
    [availableLots, form.selectedSectorId],
  )

  const selectedSector = useMemo(
    () => sectors.find((sector) => String(sector.id) === String(form.selectedSectorId)) ?? null,
    [sectors, form.selectedSectorId],
  )

  const lotsBySector = useMemo(() => {
    const map = new Map()
    availableLots.forEach((lot) => {
      map.set(lot.sector_id, (map.get(lot.sector_id) ?? 0) + 1)
    })
    return map
  }, [availableLots])

  useEffect(() => {
    if (!open) return

    setStep(0)
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

  function canAdvance() {
    if (step === 0) return Boolean(form.objet.trim())
    if (step === 1) return Boolean(form.selectedSectorId)
    return true
  }

  function goNext() {
    if (!canAdvance()) return
    setStep((value) => Math.min(value + 1, WIZARD_STEPS.length - 1))
  }

  function goBack() {
    setStep((value) => Math.max(value - 1, 0))
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
      panelClassName="new-project-modal w-full max-w-2xl text-white"
    >
      <form className="space-y-2" onSubmit={handleSubmit}>
        <WizardProgress currentStep={step} stepCount={WIZARD_STEPS.length} labels={stepLabels} />

        <div className="relative min-h-[18rem]">
          {step === 0 ? (
            <div className="wizard-step space-y-5">
              <label>
                <span className={LABEL_CLASS}>{t('projects.form.objet')}</span>
                <input
                  className={FIELD_CLASS}
                  value={form.objet}
                  onChange={(event) => updateForm({ objet: event.target.value })}
                  placeholder={t('projects.form.objetPlaceholder')}
                  required
                  autoFocus
                />
              </label>

              <div>
                <span className={LABEL_CLASS}>{t('projects.form.sector')}</span>
                <p className="mb-3 text-xs text-slate-500">{t('projects.wizard.sectorTypeHint')}</p>
                <div className="flex gap-3">
                  {PROJECT_SECTORS.map((sector) => (
                    <TypeCard
                      key={sector}
                      active={form.sector === sector}
                      title={sector}
                      onClick={() => updateForm({ sector })}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="wizard-step space-y-5">
              <div>
                <span className={LABEL_CLASS}>{t('projects.form.workSector')}</span>
                <p className="mb-4 text-xs text-slate-500">{t('projects.wizard.workSectorHint')}</p>
                {catalogError ? <p className="mb-3 text-xs text-rose-400">{catalogError}</p> : null}
                {catalogLoading ? (
                  <p className="text-xs text-slate-500">{t('common.loading')}</p>
                ) : sectors.length === 0 ? (
                  <p className="text-xs text-slate-500">{t('sectors.empty')}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {sectors.map((sector) => (
                      <SectorCard
                        key={sector.id}
                        sector={sector}
                        active={String(form.selectedSectorId) === String(sector.id)}
                        lotCount={lotsBySector.get(sector.id) ?? 0}
                        onClick={() => handleSectorChange(String(sector.id))}
                      />
                    ))}
                  </div>
                )}
              </div>

              {selectedSector && activeLots.length > 0 ? (
                <div>
                  <span className={LABEL_CLASS}>
                    {t('projects.form.lotsForSector', { sector: selectedSector.name })}
                  </span>
                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {activeLots.map((lot) => {
                      const checked = form.selectedLotIds.includes(lot.id)
                      return (
                        <label
                          key={lot.id}
                          className={[
                            'flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-200',
                            checked
                              ? 'border-white/15 bg-white/[0.05] text-white'
                              : 'border-white/[0.06] bg-[#121316] hover:bg-white/[0.02]',
                          ].join(' ')}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleLot(lot.id)}
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-600 bg-[#1c1d22] text-indigo-400 focus:ring-indigo-500/30"
                          />
                          <span className="text-xs leading-snug text-slate-300">{lot.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="wizard-step space-y-5">
              <label>
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase text-slate-500">
                      MAD
                    </span>
                  </div>
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
                  <span className={LABEL_CLASS}>{t('projects.form.progression')}</span>
                  <input
                    className={FIELD_CLASS}
                    value={form.avancement}
                    onChange={(event) => updateForm({ avancement: event.target.value })}
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-[#121316] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
                  <p className={LABEL_CLASS}>{t('projects.form.siteLocationTitle')}</p>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-slate-500">
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
                    'mt-2 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200',
                    isDragging
                      ? 'border-white/20 bg-white/[0.04]'
                      : 'border-white/[0.08] bg-[#121316] hover:border-white/12 hover:bg-white/[0.02]',
                  ].join(' ')}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => addFiles(event.target.files)}
                  />
                  <p className="text-sm font-medium text-slate-300">{t('projects.form.documentsTitle')}</p>
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
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] pt-5">
          {step > 0 ? (
            <button type="button" onClick={goBack} className={BTN_GHOST}>
              {t('projects.wizard.back')}
            </button>
          ) : (
            <button type="button" onClick={onClose} className={BTN_GHOST}>
              {t('common.cancel')}
            </button>
          )}

          {step < WIZARD_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvance()}
              className={BTN_PRIMARY}
            >
              {t('projects.wizard.next')}
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving || !form.selectedSectorId || !form.client_id}
              className={`new-project-modal-btn ${BTN_PRIMARY}`}
            >
              {saving ? t('projects.creating') : t('projects.create')}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
