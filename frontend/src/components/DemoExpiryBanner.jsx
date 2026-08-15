import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import useDemoCountdown from '../hooks/useDemoCountdown'
import { isDemoSession } from '../utils/demoSession'

export default function DemoExpiryBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, demo, logout } = useAuth()
  const { label, expired } = useDemoCountdown(user, demo)

  useEffect(() => {
    if (!isDemoSession(user, demo) || !expired) return undefined

    let cancelled = false
    async function expire() {
      try {
        await logout()
      } finally {
        if (!cancelled) {
          navigate('/?demo=expired', { replace: true })
        }
      }
    }

    expire()
    return () => {
      cancelled = true
    }
  }, [expired, user, demo, logout, navigate])

  if (!isDemoSession(user, demo) || !label) {
    return null
  }

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200">
      {t('demo.banner', { time: label })}
    </div>
  )
}
