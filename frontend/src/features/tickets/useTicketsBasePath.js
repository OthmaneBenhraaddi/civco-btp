import { useAuth } from '../../context/AuthContext'

/** Portal clients use /portal/tickets; staff use /tickets. */
export function useTicketsBasePath() {
  const { isClientPortalUser } = useAuth()
  return isClientPortalUser ? '/portal/tickets' : '/tickets'
}
