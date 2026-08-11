import { useCallback, useState } from 'react'
import { trackPrint } from '../api/prints'

/**
 * Calls the policy print endpoint before triggering window.print().
 * Returns copy/official metadata for print overlays.
 */
export function usePolicyPrint({ documentType, documentId, onTracked }) {
  const [printPolicy, setPrintPolicy] = useState(null)
  const [printing, setPrinting] = useState(false)
  const [hasHeader, setHasHeader] = useState(true)
  const [printOptionsOpen, setPrintOptionsOpen] = useState(false)

  const openPrintOptions = useCallback(() => {
    if (!documentType || !documentId) {
      return
    }

    setPrintOptionsOpen(true)
  }, [documentId, documentType])

  const closePrintOptions = useCallback(() => {
    if (!printing) {
      setPrintOptionsOpen(false)
    }
  }, [printing])

  const confirmPrint = useCallback(async () => {
    if (!documentType || !documentId) {
      return
    }

    setPrinting(true)

    try {
      const policy = await trackPrint(documentType, documentId, { hasHeader })
      setPrintPolicy(policy)
      await onTracked?.(policy)
      setPrintOptionsOpen(false)

      window.requestAnimationFrame(() => {
        window.print()
        setPrinting(false)
      })
    } catch (error) {
      setPrinting(false)
      throw error
    }
  }, [documentId, documentType, hasHeader, onTracked])

  return {
    printPolicy,
    printing,
    hasHeader,
    setHasHeader,
    printOptionsOpen,
    openPrintOptions,
    closePrintOptions,
    confirmPrint,
    /** @deprecated Prefer openPrintOptions — kept for compatibility */
    handlePrint: openPrintOptions,
    isOfficial: printPolicy?.is_official ?? false,
    isCopy: printPolicy?.is_copy ?? false,
    watermarkLabel: printPolicy?.watermark_label ?? null,
    tenantLogoUrl: printPolicy?.tenant_logo_url ?? null,
    tenantName: printPolicy?.tenant_name ?? null,
    company: printPolicy?.company ?? null,
  }
}
