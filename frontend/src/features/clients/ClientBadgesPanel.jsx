import { useEffect, useState } from 'react'
import ClientBadge, { ClientBadgeList } from '../../components/ClientBadge'
import { useTranslation } from '../../i18n/LanguageContext'
import * as clientsApi from '../../api/clients'
import * as badgesApi from '../../api/badges'
import { extractErrorMessage } from '../../utils/apiHelpers'

export function normalizeBadgeIds(ids = []) {
  return [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))]
}

export function isBadgeSelected(badgeIds, badgeId) {
  return normalizeBadgeIds(badgeIds).includes(Number(badgeId))
}

export default function ClientBadgesPanel({
  clientId,
  badges = [],
  onBadgesChange,
  canManage,
}) {
  const { t } = useTranslation()
  const [availableBadges, setAvailableBadges] = useState([])
  const [selectedIds, setSelectedIds] = useState(() => normalizeBadgeIds(badges.map((b) => b.id)))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setSelectedIds(normalizeBadgeIds(badges.map((badge) => badge.id)))
  }, [badges, clientId])

  useEffect(() => {
    async function loadBadges() {
      setLoading(true)

      try {
        const data = await badgesApi.fetchBadges()
        setAvailableBadges(data.data ?? [])
      } catch {
        setAvailableBadges([])
      } finally {
        setLoading(false)
      }
    }

    loadBadges()
  }, [])

  function toggleBadge(badgeId) {
    setSuccess(false)
    setSelectedIds((current) => {
      const normalized = normalizeBadgeIds(current)
      const id = Number(badgeId)

      if (normalized.includes(id)) {
        return normalized.filter((value) => value !== id)
      }

      return [...normalized, id]
    })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      await clientsApi.updateClient(clientId, {
        badge_ids: normalizeBadgeIds(selectedIds),
      })
      setSuccess(true)
      await onBadgesChange?.()
    } catch (err) {
      setError(extractErrorMessage(err, t('clients.badgeSaveError')))
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = JSON.stringify(normalizeBadgeIds(selectedIds)) !== JSON.stringify(
    normalizeBadgeIds(badges.map((badge) => badge.id)),
  )

  if (!canManage) {
    return badges.length > 0 ? (
      <ClientBadgeList badges={badges} />
    ) : (
      <p className="text-xs text-slate-500">{t('clients.noBadgesAssigned')}</p>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800/60 bg-[#0a0b0d]/60 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{t('clients.assignBadges')}</h3>
          <p className="mt-1 text-xs text-slate-500">{t('clients.assignBadgesHint')}</p>
        </div>
        {badges.length > 0 ? <ClientBadgeList badges={badges} /> : null}
      </div>

      {loading ? (
        <p className="text-xs text-slate-500">{t('common.loading')}</p>
      ) : availableBadges.length === 0 ? (
        <p className="text-xs text-slate-500">{t('clients.noBadgesAvailable')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {availableBadges.map((badge) => {
            const checked = isBadgeSelected(selectedIds, badge.id)

            return (
              <label
                key={badge.id}
                className={[
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors',
                  checked
                    ? 'border-slate-600/50 bg-white/[0.04]'
                    : 'border-transparent hover:bg-white/[0.02]',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleBadge(badge.id)}
                />
                <ClientBadge name={badge.name} color={badge.color} />
              </label>
            )
          })}
        </div>
      )}

      {error ? <p className="error mt-3">{error}</p> : null}
      {success ? <p className="mt-3 text-xs text-emerald-400">{t('clients.badgeSaveSuccess')}</p> : null}

      {availableBadges.length > 0 ? (
        <button
          type="button"
          className="client-action-btn mt-4"
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? t('common.saving') : t('clients.saveBadges')}
        </button>
      ) : null}
    </div>
  )
}
