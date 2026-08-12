import { useEffect, useRef, useState } from 'react'
import Modal from '../../../components/Modal'
import CutSelect from '../../../components/prodigy/CutSelect'
import NeonButton from '../../../components/prodigy/NeonButton'
import { useTranslation } from '../../../i18n/LanguageContext'
import {
  BATIMENT_LOTS,
  DEFAULT_PROJECT_FORM,
  PAYMENT_STATES,
  PROJECT_NATURES,
  PROJECT_SECTORS,
  VRD_LOTS,
  lotsForNature,
} from '../constants/projectFormConfig'

const LABEL_CLASS = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400'
const FIELD_CLASS =
  'w-full border-0 bg-[#111722] px-3 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_8px,100%_calc(100%-8px),calc(100%-8px)_100%,8px_100%,0_calc(100%-8px),0_8px)] [filter:drop-shadow(0_0_0.6px_#5b6a82)_drop-shadow(0_0_0.6px_#5b6a82)] focus:[filter:drop-shadow(0_0_0.7px_var(--pg-accent))_drop-shadow(0_0_0.7px_var(--pg-accent))]'

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

  const activeLots = form.nature === 'BÂTIMENT' ? BATIMENT_LOTS : VRD_LOTS

  useEffect(() => {
    if (!open) return

    setForm({
      ...DEFAULT_PROJECT_FORM,
      client_id: clients[0]?.id ? String(clients[0].id) : '',
    })
    setDocuments([])
    setIsDragging(false)
  }, [open, clients])

  function updateForm(patch) {
    setForm((current) => ({ ...current, ...patch }))
  }

  function handleNatureChange(nature) {
    const allowed = lotsForNature(nature)
    updateForm({
      nature,
      selectedLots: form.selectedLots.filter((lot) => allowed.includes(lot)),
    })
  }

  function toggleLot(lot) {
    setForm((current) => {
      const selected = current.selectedLots.includes(lot)
        ? current.selectedLots.filter((item) => item !== lot)
        : [...current.selectedLots, lot]
      return { ...current, selectedLots: selected }
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
    await onSubmit({ ...form, documentMeta })
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
            <CutSelect
              className="w-full"
              value={form.client_id}
              onChange={(client_id) => updateForm({ client_id })}
              placeholder={t('projects.selectClient')}
              options={[
                { value: '', label: t('projects.selectClient') },
                ...clients.map((client) => ({ value: String(client.id), label: client.name })),
              ]}
            />
          </label>

          <label>
            <span className={LABEL_CLASS}>{t('projects.form.nature')}</span>
            <CutSelect
              className="w-full"
              value={form.nature}
              onChange={handleNatureChange}
              options={PROJECT_NATURES.map((nature) => ({ value: nature, label: nature }))}
            />
          </label>

          <label>
            <span className={LABEL_CLASS}>{t('projects.form.paymentState')}</span>
            <CutSelect
              className="w-full"
              value={form.etatPaiement}
              onChange={(etatPaiement) => updateForm({ etatPaiement })}
              options={PAYMENT_STATES.map((state) => ({ value: state, label: state }))}
            />
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
            {form.nature === 'BÂTIMENT' ? t('projects.form.lotsBatiment') : t('projects.form.lotsVrd')}
          </span>
          <div className="mt-2 grid grid-cols-1 gap-2 rounded-xl bg-[#111827] p-3 text-xs text-slate-300 md:grid-cols-2">
            {activeLots.map((lot) => {
              const checked = form.selectedLots.includes(lot)
              return (
                <label
                  key={lot}
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
                    onChange={() => toggleLot(lot)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-600 bg-[#111827] text-slate-400 focus:ring-slate-500"
                  />
                  <span className="leading-snug">{lot}</span>
                </label>
              )
            })}
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
          <NeonButton type="button" variant="ghost" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </NeonButton>
          <NeonButton type="submit" size="sm" disabled={saving}>
            {saving ? t('projects.creating') : t('projects.create')}
          </NeonButton>
        </div>
      </form>
    </Modal>
  )
}
