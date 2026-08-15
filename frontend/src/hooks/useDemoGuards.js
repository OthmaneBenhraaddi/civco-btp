import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useTranslation } from '../i18n/LanguageContext'
import { isDemoSession } from '../utils/demoSession'

/** Returns true if the action should abort (demo restriction). */
export function useDemoGuards() {
  const { user, demo, isDemo } = useAuth()
  const { t } = useTranslation()
  const { pushToast } = useToast()

  function blockDestructive(actionLabel) {
    if (!isDemo && !isDemoSession(user, demo)) {
      return false
    }

    pushToast({
      action: 'suppression',
      message: t('demo.restricted', { action: actionLabel || t('demo.destructiveDefault') }),
    })
    return true
  }

  return {
    isDemo: isDemo || isDemoSession(user, demo),
    blockDestructive,
  }
}
