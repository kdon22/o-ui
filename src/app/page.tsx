import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export default async function MainPage() {
  const session = await getServerSession(authOptions)

  console.log('🏠 MainPage: Session data:', {
    hasSession: !!session,
    userId: session?.user?.id,
    tenantId: session?.user?.tenantId,
    rootNodeId: session?.user?.rootNodeId,
    rootNodeIdShort: session?.user?.rootNodeIdShort,
    lastAccessedNodeIdShort: session?.user?.preferences?.lastAccessedNodeIdShort,
    preferences: session?.user?.preferences
  })

  if (!session) {
    console.log('🏠 MainPage: No session, redirecting to login')
    redirect('/login')
  }

  // Get last accessed node from preferences, fallback to root node
  const lastAccessedNodeIdShort = session.user.preferences?.lastAccessedNodeIdShort
  const hasLastAccessed = lastAccessedNodeIdShort && lastAccessedNodeIdShort !== 'undefined'

  console.log('🏠 MainPage: Navigation decision:', {
    lastAccessedNodeIdShort,
    hasLastAccessed,
    rootNodeIdShort: session.user.rootNodeIdShort
  })

  if (hasLastAccessed) {
    // Redirect to last accessed node (normalize to lowercase)
    const normalizedLastAccessed = lastAccessedNodeIdShort.toLowerCase()
    console.log('🔄 Redirecting to last accessed node:', lastAccessedNodeIdShort, '→', normalizedLastAccessed)
    redirect(`/nodes/${normalizedLastAccessed}`)
  }

  // No last accessed node, use root node idShort from session
  const rootNodeIdShort = session.user.rootNodeIdShort
  
  if (!rootNodeIdShort) {
    console.error('❌ No root node idShort found in session')
    redirect('/login')
  }

  // Normalize to lowercase for consistent URLs
  const normalizedRootNodeIdShort = rootNodeIdShort.toLowerCase()
  console.log('🏠 Redirecting to root node:', rootNodeIdShort, '→', normalizedRootNodeIdShort)
  redirect(`/nodes/${normalizedRootNodeIdShort}`)
} 