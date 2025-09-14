import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { extractBranchInfo, type BranchInfo } from '@/lib/utils/branch-utils'

export interface SessionContext {
  session: any
  branchContext: {
    currentBranch: BranchInfo
    availableBranches: BranchInfo[]
  } | null
  userRootNodeId: string
  currentTenant: any
  isLoading: boolean
}

export function useSessionContext(): SessionContext {
  const { data: session, status } = useSession()
  
  const branchContext = useMemo(() => {
    if (!session) return null
    const { currentBranch, availableBranches } = extractBranchInfo(session)
    return currentBranch ? { currentBranch, availableBranches } : null
  }, [session])

  const userRootNodeId = session?.user?.rootNodeId || '1'
  const currentTenant = session?.user?.currentTenant
  const isLoading = status === 'loading'

  return {
    session,
    branchContext,
    userRootNodeId,
    currentTenant,
    isLoading
  }
} 