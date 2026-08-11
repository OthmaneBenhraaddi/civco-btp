import { useCallback, useState } from 'react'
import { usePolicyPrint } from './usePolicyPrint'

export function usePolicyCommercialPrint({ documentType, documentId, onTracked }) {
  const [trackedPolicy, setTrackedPolicy] = useState(null)

  const handleTracked = useCallback(async (policy) => {
    setTrackedPolicy(policy)
    await onTracked?.(policy)
  }, [onTracked])

  const policyPrint = usePolicyPrint({
    documentType,
    documentId,
    onTracked: handleTracked,
  })

  const activePolicy = trackedPolicy ?? policyPrint.printPolicy
  const hasHeader = activePolicy?.has_header ?? policyPrint.hasHeader

  return {
    ...policyPrint,
    trackedPolicy,
    isCopy: activePolicy?.is_copy ?? false,
    copyStrength: activePolicy?.copy_strength ?? null,
    hasHeader,
    tenantLogoUrl: hasHeader
      ? (activePolicy?.tenant_logo_url ?? policyPrint.tenantLogoUrl)
      : null,
    tenantName: hasHeader
      ? (activePolicy?.tenant_name ?? policyPrint.tenantName)
      : null,
    company: hasHeader
      ? (activePolicy?.company ?? policyPrint.company)
      : null,
  }
}
