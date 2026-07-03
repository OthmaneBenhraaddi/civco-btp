import { useCallback, useState } from 'react'
import { trackPrint } from '../api/prints'

/**
 * Calls the policy print endpoint before triggering window.print().
 * Returns copy/official metadata for print overlays.
 */
export function usePolicyPrint({ documentType, documentId, onTracked }) {
  const [printPolicy, setPrintPolicy] = useState(null)
  const [printing, setPrinting] = useState(false)

  const handlePrint = useCallback(async () => {
    if (!documentType || !documentId) {
      return
    }

    setPrinting(true)

    try {
      const policy = await trackPrint(documentType, documentId)
      setPrintPolicy(policy)
      await onTracked?.(policy)

      window.requestAnimationFrame(() => {
        window.print()
        setPrinting(false)
      })
    } catch (error) {
      setPrinting(false)
      throw error
    }
  }, [documentId, documentType, onTracked])

  return {
    printPolicy,
    printing,
    handlePrint,
    isOfficial: printPolicy?.is_official ?? false,
    isCopy: printPolicy?.is_copy ?? false,
    watermarkLabel: printPolicy?.watermark_label ?? null,
    tenantLogoUrl: printPolicy?.tenant_logo_url ?? null,
    tenantName: printPolicy?.tenant_name ?? null,
  }
}
