import { useCallback, useEffect, useRef, useState } from 'react'
import CutFrame from '../../components/prodigy/CutFrame'
import NeonButton from '../../components/prodigy/NeonButton'
import SuperAdminPageHeader from './components/SuperAdminPageHeader'
import * as homepageApi from '../../api/homepage'
import { useTranslation } from '../../i18n/LanguageContext'
import { FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'

const EMPTY = {
  hero: {
    title: '',
    highlight: '',
    description: '',
    background_url: null,
  },
  partners: [],
  cards: [],
}

export default function SuperAdminHomepagePage() {
  const { t } = useTranslation()
  const heroInputRef = useRef(null)
  const partnerInputRef = useRef(null)
  const [content, setContent] = useState(EMPTY)
  const [heroTitle, setHeroTitle] = useState('')
  const [heroHighlight, setHeroHighlight] = useState('')
  const [heroDescription, setHeroDescription] = useState('')
  const [cards, setCards] = useState([])
  const [partnerName, setPartnerName] = useState('')
  const [partnerFile, setPartnerFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const applyContent = useCallback((data) => {
    setContent(data)
    setHeroTitle(data.hero?.title ?? '')
    setHeroHighlight(data.hero?.highlight ?? '')
    setHeroDescription(data.hero?.description ?? '')
    setCards((data.cards ?? []).map((card) => ({ ...card })))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      applyContent(await homepageApi.fetchHomepageCms())
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.homepage.loadError')))
    } finally {
      setLoading(false)
    }
  }, [applyContent, t])

  useEffect(() => {
    load()
  }, [load])

  async function handleSaveCopy(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const data = await homepageApi.updateHomepageCopy({
        hero_title: heroTitle.trim(),
        hero_highlight: heroHighlight.trim() || null,
        hero_description: heroDescription.trim() || null,
        cards: cards.map((card) => ({
          id: card.id,
          title: card.title,
          description: card.description,
        })),
      })
      applyContent(data)
      setSuccess(t('superAdmin.homepage.saveSuccess'))
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.homepage.saveError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleHeroUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    setError('')
    try {
      applyContent(await homepageApi.uploadHeroBackground(file))
      setSuccess(t('superAdmin.homepage.heroUploadSuccess'))
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.homepage.heroUploadError')))
    }
  }

  async function handleHeroDelete() {
    setError('')
    try {
      applyContent(await homepageApi.deleteHeroBackground())
      setSuccess(t('superAdmin.homepage.heroDeleteSuccess'))
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.homepage.heroDeleteError')))
    }
  }

  async function handlePartnerUpload(event) {
    event.preventDefault()
    if (!partnerFile) {
      setError(t('superAdmin.homepage.partnerLogoRequired'))
      return
    }

    setError('')
    try {
      applyContent(await homepageApi.uploadPartnerLogo({
        name: partnerName.trim() || partnerFile.name,
        logo: partnerFile,
      }))
      setPartnerName('')
      setPartnerFile(null)
      if (partnerInputRef.current) {
        partnerInputRef.current.value = ''
      }
      setSuccess(t('superAdmin.homepage.partnerUploadSuccess'))
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.homepage.partnerUploadError')))
    }
  }

  async function handlePartnerDelete(id) {
    if (!window.confirm(t('superAdmin.homepage.partnerDeleteConfirm'))) {
      return
    }

    setError('')
    try {
      applyContent(await homepageApi.deletePartnerLogo(id))
      setSuccess(t('superAdmin.homepage.partnerDeleteSuccess'))
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.homepage.partnerDeleteError')))
    }
  }

  async function handleCardImage(cardId, file) {
    if (!file) {
      return
    }

    setError('')
    try {
      applyContent(await homepageApi.uploadCardImage(cardId, file))
      setSuccess(t('superAdmin.homepage.cardUploadSuccess'))
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.homepage.cardUploadError')))
    }
  }

  async function handleCardImageDelete(cardId) {
    setError('')
    try {
      applyContent(await homepageApi.deleteCardImage(cardId))
      setSuccess(t('superAdmin.homepage.cardDeleteSuccess'))
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.homepage.cardDeleteError')))
    }
  }

  return (
    <div className="list-page mx-auto max-w-[1100px] space-y-6">
      <SuperAdminPageHeader
        title={t('superAdmin.homepage.title')}
        subtitle={t('superAdmin.homepage.subtitle')}
      />

      {error ? (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{success}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-400">{t('common.loading')}</p>
      ) : (
        <>
          <form onSubmit={handleSaveCopy} className="space-y-6">
            <CutFrame size="md" innerClassName="bg-[#0e131f] p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
                {t('superAdmin.homepage.heroSection')}
              </h2>
              <label className="block">
                <span className={LABEL_CLASS}>{t('superAdmin.homepage.heroTitle')}</span>
                <input className={FIELD_CLASS} value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} required />
              </label>
              <label className="block">
                <span className={LABEL_CLASS}>{t('superAdmin.homepage.heroHighlight')}</span>
                <input className={FIELD_CLASS} value={heroHighlight} onChange={(e) => setHeroHighlight(e.target.value)} />
              </label>
              <label className="block">
                <span className={LABEL_CLASS}>{t('superAdmin.homepage.heroDescription')}</span>
                <textarea
                  className={`${FIELD_CLASS} min-h-[110px]`}
                  value={heroDescription}
                  onChange={(e) => setHeroDescription(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {content.hero?.background_url ? (
                  <img
                    src={content.hero.background_url}
                    alt=""
                    className="h-16 w-28 object-cover opacity-80"
                  />
                ) : null}
                <input
                  ref={heroInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleHeroUpload}
                />
                <NeonButton type="button" size="sm" variant="ghost" onClick={() => heroInputRef.current?.click()}>
                  {t('superAdmin.homepage.uploadHero')}
                </NeonButton>
                {content.hero?.background_url ? (
                  <NeonButton type="button" size="sm" variant="danger" onClick={handleHeroDelete}>
                    {t('common.delete')}
                  </NeonButton>
                ) : null}
              </div>
            </CutFrame>

            <CutFrame size="md" innerClassName="bg-[#0e131f] p-6 space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
                {t('superAdmin.homepage.cardsSection')}
              </h2>
              {cards.map((card, index) => (
                <div key={card.id} className="grid gap-3 border-t border-white/[0.06] pt-4 first:border-0 first:pt-0 md:grid-cols-[140px_1fr]">
                  <div>
                    {card.image_url ? (
                      <img src={card.image_url} alt="" className="mb-2 h-20 w-full object-cover opacity-80" />
                    ) : null}
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="block w-full text-xs text-slate-400"
                      onChange={(event) => {
                        handleCardImage(card.id, event.target.files?.[0])
                        event.target.value = ''
                      }}
                    />
                    {card.image_url ? (
                      <button
                        type="button"
                        className="mt-1 text-[11px] uppercase tracking-wider text-rose-300"
                        onClick={() => handleCardImageDelete(card.id)}
                      >
                        {t('superAdmin.homepage.resetImage')}
                      </button>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    <label className="block">
                      <span className={LABEL_CLASS}>{t('superAdmin.homepage.cardTitle', { n: index + 1 })}</span>
                      <input
                        className={FIELD_CLASS}
                        value={card.title}
                        onChange={(event) => {
                          const value = event.target.value
                          setCards((current) => current.map((item) => (
                            item.id === card.id ? { ...item, title: value } : item
                          )))
                        }}
                        required
                      />
                    </label>
                    <label className="block">
                      <span className={LABEL_CLASS}>{t('superAdmin.homepage.cardDescription')}</span>
                      <textarea
                        className={`${FIELD_CLASS} min-h-[80px]`}
                        value={card.description ?? ''}
                        onChange={(event) => {
                          const value = event.target.value
                          setCards((current) => current.map((item) => (
                            item.id === card.id ? { ...item, description: value } : item
                          )))
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </CutFrame>

            <NeonButton type="submit" size="sm" disabled={saving} className={saving ? 'opacity-45' : ''}>
              {saving ? t('common.saving') : t('common.save')}
            </NeonButton>
          </form>

          <CutFrame size="md" innerClassName="bg-[#0e131f] p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
              {t('superAdmin.homepage.partnersSection')}
            </h2>
            <form onSubmit={handlePartnerUpload} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block min-w-0 flex-1">
                <span className={LABEL_CLASS}>{t('superAdmin.homepage.partnerName')}</span>
                <input
                  className={FIELD_CLASS}
                  value={partnerName}
                  onChange={(event) => setPartnerName(event.target.value)}
                  placeholder={t('superAdmin.homepage.partnerNamePlaceholder')}
                />
              </label>
              <label className="block min-w-0 flex-1">
                <span className={LABEL_CLASS}>{t('superAdmin.homepage.partnerLogo')}</span>
                <input
                  ref={partnerInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className={`${FIELD_CLASS} file:mr-3 file:border-0 file:bg-transparent file:text-xs file:text-emerald-300`}
                  onChange={(event) => setPartnerFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <NeonButton type="submit" size="sm">
                {t('superAdmin.homepage.uploadPartner')}
              </NeonButton>
            </form>

            {content.partners.length === 0 ? (
              <p className="text-sm text-slate-500">{t('superAdmin.homepage.noPartners')}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {content.partners.map((partner) => (
                  <li key={partner.id} className="flex items-center justify-between gap-3 border border-white/[0.06] bg-[#101722] px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="h-8 w-16 object-contain opacity-80"
                      />
                      <span className="truncate text-sm text-white">{partner.name}</span>
                    </div>
                    <NeonButton type="button" size="sm" variant="danger" onClick={() => handlePartnerDelete(partner.id)}>
                      {t('common.delete')}
                    </NeonButton>
                  </li>
                ))}
              </ul>
            )}
          </CutFrame>
        </>
      )}
    </div>
  )
}
