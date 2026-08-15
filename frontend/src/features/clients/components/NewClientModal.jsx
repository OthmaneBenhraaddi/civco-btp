import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Modal from '../../../components/Modal'
import CutSelect from '../../../components/prodigy/CutSelect'
import { useWizardResetOnOpen } from '../../../hooks/useWizardResetOnOpen'
import { useTranslation } from '../../../i18n/LanguageContext'
import { CONTACT_ROLE_OPTIONS } from '../../../api/clientContacts'
import { handleWizardEnterKey } from '../../../utils/wizardForm'
import { hexToRgba } from '../../../utils/colorUtils'
import { isBadgeSelected, normalizeBadgeIds } from '../ClientBadgesPanel'
import {
  FIELD_CLASS,
  LABEL_CLASS,
} from '../../../theme/designTokens'
import WizardProgress from '../../../components/wizard/WizardProgress'
import { TypeCard } from '../../../components/wizard/wizardCards'
import NeonButton from '../../../components/prodigy/NeonButton'

const WIZARD_STEPS = ['general', 'coordinates', 'contacts']

const CLIENT_TYPES = ['externe', 'interne']

const emptyContact = {
  name: '',
  email: '',
  phone: '',
  contact_role: 'commercial',
}

export const DEFAULT_CLIENT_WIZARD_FORM = {
  name: '',
  client_type: 'externe',
  is_active: true,
  is_official: true,
  role_id: 'client_extern',
  badge_ids: [],
  address_line1: '',
  city: '',
  postal_code: '',
  country: 'FR',
  phone: '',
  email: '',
  notes: '',
  contact_name: '',
}

export default function NewClientModal({
  open,
  onClose,
  availableBadges = [],
  onSubmit,
  saving = false,
}) {
  const { t } = useTranslation()
  const stepContentRef = useRef(null)
  const finalSubmitLockRef = useRef(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(DEFAULT_CLIENT_WIZARD_FORM)
  const [extraContacts, setExtraContacts] = useState([])

  const stepLabels = [
    t('clients.wizard.stepGeneral'),
    t('clients.wizard.stepCoordinates'),
    t('clients.wizard.stepContacts'),
  ]

  const resetWizard = useCallback(() => {
    setStep(0)
    setForm(DEFAULT_CLIENT_WIZARD_FORM)
    setExtraContacts([])
    finalSubmitLockRef.current = false
  }, [])

  useWizardResetOnOpen(open, resetWizard)

  useEffect(() => {
    if (!open) {
      return
    }

    stepContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [open, step])

  function updateForm(patch) {
    setForm((current) => ({ ...current, ...patch }))
  }

  function selectClientType(clientType) {
    updateForm({
      client_type: clientType,
      role_id: clientType === 'interne' ? 'conducteur_travaux' : 'client_extern',
    })
  }

  function canAdvance() {
    if (step === 0) return Boolean(form.name.trim())
    return true
  }

  function goNext() {
    if (!canAdvance()) return
    setStep((value) => Math.min(value + 1, WIZARD_STEPS.length - 1))
  }

  function goBack() {
    setStep((value) => Math.max(value - 1, 0))
  }

  function addExtraContact() {
    setExtraContacts((current) => [...current, { ...emptyContact }])
  }

  function updateExtraContact(index, patch) {
    setExtraContacts((current) =>
      current.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, ...patch } : contact,
      ),
    )
  }

  function removeExtraContact(index) {
    setExtraContacts((current) => current.filter((_, contactIndex) => contactIndex !== index))
  }

  function buildNotes() {
    const parts = []
    parts.push(
      form.client_type === 'interne'
        ? t('clients.wizard.typeInternal')
        : t('clients.wizard.typeExternal'),
    )
    if (form.notes.trim()) {
      parts.push(form.notes.trim())
    }
    return parts.join('\n')
  }

  async function handleFinalSubmit() {
    if (saving || finalSubmitLockRef.current || !form.name.trim()) {
      return
    }

    finalSubmitLockRef.current = true

    try {
      const primaryEmail = form.email || extraContacts[0]?.email || ''
      const primaryPhone = form.phone || extraContacts[0]?.phone || ''
      const primaryContactName = form.contact_name || extraContacts[0]?.name || ''

      await onSubmit({
        form: {
          name: form.name.trim(),
          contact_name: primaryContactName,
          email: primaryEmail,
          phone: primaryPhone,
          address_line1: form.address_line1,
          city: form.city,
          postal_code: form.postal_code,
          country: form.country,
          notes: buildNotes(),
          is_active: form.is_active,
          is_official: form.is_official,
          badge_ids: normalizeBadgeIds(form.badge_ids),
          role_id: form.role_id,
        },
        extraContacts: extraContacts
          .filter((contact) => contact.name.trim())
          .map((contact) => ({
            name: contact.name.trim(),
            email: contact.email || null,
            phone: contact.phone || null,
            contact_role: contact.contact_role,
          })),
      })
    } finally {
      finalSubmitLockRef.current = false
    }
  }

  function handleWizardKeyDown(event) {
    handleWizardEnterKey(event, {
      step,
      totalSteps: WIZARD_STEPS.length,
      canAdvance,
      goNext,
      onFinalSubmit: handleFinalSubmit,
    })
  }

  return (
    <Modal
      title={t('clients.new')}
      open={open}
      onClose={onClose}
      panelClassName="new-client-modal w-full max-w-2xl text-white"
    >
      <div className="space-y-4" onKeyDown={handleWizardKeyDown}>
        <WizardProgress currentStep={step} stepCount={WIZARD_STEPS.length} labels={stepLabels} />

        <div ref={stepContentRef} className="relative min-h-[12rem]">
          {step === 0 ? (
            <div className="wizard-step space-y-4">
              <label>
                <span className={LABEL_CLASS}>{t('clients.name')}</span>
                <input
                  className={FIELD_CLASS}
                  value={form.name}
                  onChange={(event) => updateForm({ name: event.target.value })}
                  placeholder={t('clients.wizard.namePlaceholder')}
                  autoFocus
                />
              </label>

              <div>
                <span className={LABEL_CLASS}>{t('clients.wizard.clientType')}</span>
                <p className="mb-2 text-xs text-slate-400">{t('clients.wizard.clientTypeHint')}</p>
                <div className="flex gap-3">
                  {CLIENT_TYPES.map((type) => (
                    <TypeCard
                      key={type}
                      active={form.client_type === type}
                      title={
                        type === 'externe'
                          ? t('clients.wizard.typeExternal')
                          : t('clients.wizard.typeInternal')
                      }
                      description={
                        type === 'externe'
                          ? t('clients.wizard.typeExternalDesc')
                          : t('clients.wizard.typeInternalDesc')
                      }
                      onClick={() => selectClientType(type)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium text-white">{t('common.active')}</p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-400">
                      {t('clients.wizard.activeHint')}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.is_active}
                    aria-label={t('common.active')}
                    onClick={() => updateForm({ is_active: !form.is_active })}
                    className={['pg-toggle', form.is_active ? 'is-on' : ''].filter(Boolean).join(' ')}
                  >
                    <span className="pg-toggle__knob" />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium text-white">{t('clients.isOfficial')}</p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-400">
                      {t('clients.isOfficialHint')}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.is_official}
                    aria-label={t('clients.isOfficial')}
                    onClick={() => updateForm({ is_official: !form.is_official })}
                    className={[
                      'pg-toggle',
                      form.is_official ? 'is-on is-sky' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className="pg-toggle__knob" />
                  </button>
                </div>
              </div>

              {availableBadges.length > 0 ? (
                <div>
                  <span className={LABEL_CLASS}>{t('clients.assignBadges')}</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableBadges.map((badge) => {
                      const active = isBadgeSelected(form.badge_ids, badge.id)
                      const color = badge.color || '#64748B'

                      return (
                        <button
                          key={badge.id}
                          type="button"
                          aria-pressed={active}
                          className={['pg-badge-pill', active ? 'is-active' : ''].filter(Boolean).join(' ')}
                          style={{
                            '--badge-color': color,
                            '--badge-bg': hexToRgba(color, active ? 0.28 : 0.06),
                            '--badge-border': hexToRgba(color, active ? 0.9 : 0.28),
                            '--badge-text': active ? '#ffffff' : hexToRgba(color, 0.75),
                            '--badge-glow': hexToRgba(color, 0.42),
                          }}
                          onClick={() => {
                            const badgeId = Number(badge.id)
                            const badgeIds = active
                              ? normalizeBadgeIds(form.badge_ids).filter((id) => id !== badgeId)
                              : normalizeBadgeIds([...form.badge_ids, badgeId])
                            updateForm({ badge_ids: badgeIds })
                          }}
                        >
                          {badge.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="wizard-step space-y-5">
              <label>
                <span className={LABEL_CLASS}>{t('clients.address')}</span>
                <input
                  className={FIELD_CLASS}
                  value={form.address_line1}
                  onChange={(event) => updateForm({ address_line1: event.target.value })}
                  placeholder={t('clients.wizard.addressPlaceholder')}
                />
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label>
                  <span className={LABEL_CLASS}>{t('clients.city')}</span>
                  <input
                    className={FIELD_CLASS}
                    value={form.city}
                    onChange={(event) => updateForm({ city: event.target.value })}
                  />
                </label>
                <label>
                  <span className={LABEL_CLASS}>{t('clients.postalCode')}</span>
                  <input
                    className={FIELD_CLASS}
                    value={form.postal_code}
                    onChange={(event) => updateForm({ postal_code: event.target.value })}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label>
                  <span className={LABEL_CLASS}>{t('clients.phone')}</span>
                  <input
                    className={FIELD_CLASS}
                    value={form.phone}
                    onChange={(event) => updateForm({ phone: event.target.value })}
                  />
                </label>
                <label>
                  <span className={LABEL_CLASS}>{t('clients.email')}</span>
                  <input
                    type="email"
                    className={FIELD_CLASS}
                    value={form.email}
                    onChange={(event) => updateForm({ email: event.target.value })}
                  />
                </label>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="wizard-step space-y-5">
              <div>
                <span className={LABEL_CLASS}>{t('clients.wizard.primaryContact')}</span>
                <p className="mb-3 text-xs text-slate-400">{t('clients.wizard.primaryContactHint')}</p>
                <label className="block">
                  <span className="mb-2 block text-xs text-slate-400">{t('clients.contactName')}</span>
                  <input
                    className={FIELD_CLASS}
                    value={form.contact_name}
                    onChange={(event) => updateForm({ contact_name: event.target.value })}
                  />
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <span className={LABEL_CLASS}>{t('clients.wizard.additionalContacts')}</span>
                    <p className="mt-1 text-xs text-slate-400">{t('clients.wizard.additionalContactsHint')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={addExtraContact}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#121316] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t('clients.wizard.addContact')}
                  </button>
                </div>

                {extraContacts.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/[0.08] bg-[#121316]/60 px-4 py-8 text-center text-xs text-slate-500">
                    {t('clients.wizard.noExtraContacts')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {extraContacts.map((contact, index) => (
                      <div
                        key={`contact-${index}`}
                        className="rounded-2xl border border-white/[0.06] bg-[#121316] p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-medium text-slate-300">
                            {t('clients.wizard.contactNumber', { number: index + 1 })}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeExtraContact(index)}
                            className="text-slate-500 transition hover:text-rose-400"
                            aria-label={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <label className="md:col-span-2">
                            <span className="mb-1.5 block text-xs text-slate-400">{t('clients.contactName')}</span>
                            <input
                              className={FIELD_CLASS}
                              value={contact.name}
                              onChange={(event) => updateExtraContact(index, { name: event.target.value })}
                            />
                          </label>
                          <label>
                            <span className="mb-1.5 block text-xs text-slate-400">{t('clients.email')}</span>
                            <input
                              type="email"
                              className={FIELD_CLASS}
                              value={contact.email}
                              onChange={(event) => updateExtraContact(index, { email: event.target.value })}
                            />
                          </label>
                          <label>
                            <span className="mb-1.5 block text-xs text-slate-400">{t('clients.phone')}</span>
                            <input
                              className={FIELD_CLASS}
                              value={contact.phone}
                              onChange={(event) => updateExtraContact(index, { phone: event.target.value })}
                            />
                          </label>
                          <label className="md:col-span-2">
                            <span className="mb-1.5 block text-xs text-slate-400">{t('clientContacts.role')}</span>
                            <CutSelect
                              className="w-full"
                              size="sm"
                              value={contact.contact_role}
                              onChange={(next) =>
                                updateExtraContact(index, { contact_role: next })
                              }
                              options={CONTACT_ROLE_OPTIONS.map((role) => ({
                                value: role,
                                label: t(`clientContacts.roles.${role}`),
                              }))}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label>
                <span className={LABEL_CLASS}>{t('clients.notes')}</span>
                <textarea
                  rows={3}
                  className={FIELD_CLASS}
                  value={form.notes}
                  onChange={(event) => updateForm({ notes: event.target.value })}
                  placeholder={t('clients.wizard.notesPlaceholder')}
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] pt-5">
          {step > 0 ? (
            <NeonButton type="button" onClick={goBack} variant="ghost" size="sm">
              {t('clients.wizard.back')}
            </NeonButton>
          ) : (
            <NeonButton type="button" onClick={onClose} variant="ghost" size="sm">
              {t('common.cancel')}
            </NeonButton>
          )}

          {step < WIZARD_STEPS.length - 1 ? (
            <NeonButton type="button" onClick={goNext} disabled={!canAdvance()} size="sm">
              {t('clients.wizard.next')}
            </NeonButton>
          ) : (
            <NeonButton
              type="button"
              onClick={handleFinalSubmit}
              disabled={saving || !form.name.trim()}
              size="sm"
            >
              {saving ? t('common.saving') : t('clients.create')}
            </NeonButton>
          )}
        </div>
      </div>
    </Modal>
  )
}
