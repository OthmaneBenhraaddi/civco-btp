import { useEffect, useState } from 'react'
import { AUDIT_LOG_EVENT, readAuditLogs } from './auditLogStore'

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState(() => readAuditLogs())

  useEffect(() => {
    function syncLogs() {
      setAuditLogs(readAuditLogs())
    }

    window.addEventListener(AUDIT_LOG_EVENT, syncLogs)
    return () => window.removeEventListener(AUDIT_LOG_EVENT, syncLogs)
  }, [])

  return auditLogs
}
