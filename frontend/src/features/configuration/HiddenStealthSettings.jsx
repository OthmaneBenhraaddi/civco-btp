import { useEffect, useRef, useState } from 'react'
import { useStealthMode } from '../../context/StealthModeContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { BTN_GHOST } from '../../theme/designTokens'
import {
  formatStealthShortcut,
  isModifierOnlyKey,
  shortcutFromKeyboardEvent,
} from '../../utils/stealthShortcut'

const UNLOCK_CLICKS = 5
const UNLOCK_WINDOW_MS = 2500

/**
 * Camouflaged per-admin shortcut editor.
 * Not labeled as stealth — unlock by rapid-clicking the faint mark, then change keys only.
 */
export default function HiddenStealthSettings() {
  const { t } = useTranslation()
  const {
    stealthShortcut,
    stealthShortcutLabel,
    setStealthShortcut,
    resetStealthShortcut,
    shortcutSaving,
  } = useStealthMode()

  const [unlocked, setUnlocked] = useState(false)
  const [recording, setRecording] = useState(false)
  const [captureError, setCaptureError] = useState('')
  const [saveError, setSaveError] = useState('')
  const clickTimesRef = useRef([])

  function handleCamouflageClick() {
    const now = Date.now()
    const recent = clickTimesRef.current.filter((time) => now - time < UNLOCK_WINDOW_MS)
    recent.push(now)
    clickTimesRef.current = recent

    if (recent.length >= UNLOCK_CLICKS) {
      clickTimesRef.current = []
      setUnlocked(true)
      setCaptureError('')
      setSaveError('')
    }
  }

  useEffect(() => {
    if (!recording) {
      return undefined
    }

    function onKeyDown(event) {
      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') {
        setRecording(false)
        setCaptureError('')
        return
      }

      if (isModifierOnlyKey(event.key)) {
        return
      }

      const next = shortcutFromKeyboardEvent(event)
      if (!next) {
        setCaptureError(t('configuration.stealth.invalidShortcut'))
        return
      }

      if (!next.ctrl && !next.shift && !next.alt && !next.meta) {
        setCaptureError(t('configuration.stealth.modifierRequired'))
        return
      }

      setRecording(false)
      setCaptureError('')
      setSaveError('')
      setStealthShortcut(next).catch(() => {
        setSaveError(t('configuration.stealth.saveError'))
      })
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [recording, setStealthShortcut, t])

  if (!unlocked) {
    return (
      <div className="mt-12 flex justify-end pr-1">
        <button
          type="button"
          onClick={handleCamouflageClick}
          className="select-none rounded px-1.5 py-0.5 text-[9px] leading-none tracking-[0.4em] text-slate-800/35 hover:text-slate-700/50"
          aria-hidden="true"
          tabIndex={-1}
        >
          ···
        </button>
      </div>
    )
  }

  return (
    <section className="mt-10 rounded-xl border border-white/[0.03] bg-transparent p-3">
      <p className="text-[10px] uppercase tracking-widest text-slate-600">
        {t('configuration.stealth.camouflageTitle')}
      </p>
      <p className="mt-1 text-[11px] text-slate-600">
        {t('configuration.stealth.camouflageHint')}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <kbd className="rounded border border-white/5 bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] text-slate-400">
          {recording
            ? t('configuration.stealth.recording')
            : stealthShortcutLabel}
        </kbd>

        <button
          type="button"
          className={`${BTN_GHOST} !px-2 !py-1 !text-xs !text-slate-500`}
          data-stealth-shortcut-capture="1"
          disabled={shortcutSaving}
          onClick={() => {
            setCaptureError('')
            setSaveError('')
            setRecording((value) => !value)
          }}
        >
          {recording
            ? t('configuration.stealth.cancelRecord')
            : t('configuration.stealth.changeShortcut')}
        </button>

        <button
          type="button"
          className={`${BTN_GHOST} !px-2 !py-1 !text-xs !text-slate-500`}
          disabled={shortcutSaving}
          onClick={() => {
            setRecording(false)
            setCaptureError('')
            setSaveError('')
            resetStealthShortcut().catch(() => {
              setSaveError(t('configuration.stealth.saveError'))
            })
          }}
        >
          {t('configuration.stealth.resetShortcut')}
        </button>

        <button
          type="button"
          className={`${BTN_GHOST} !px-2 !py-1 !text-xs !text-slate-600`}
          onClick={() => {
            setUnlocked(false)
            setRecording(false)
          }}
        >
          {t('configuration.stealth.hideAgain')}
        </button>
      </div>

      {captureError || saveError ? (
        <p className="mt-2 text-xs text-rose-300/80">{captureError || saveError}</p>
      ) : (
        <p className="mt-2 text-[10px] text-slate-700">
          {formatStealthShortcut(stealthShortcut)}
        </p>
      )}
    </section>
  )
}
