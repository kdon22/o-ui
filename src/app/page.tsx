import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export default async function MainPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Get last accessed node from preferences, fallback to root node
  const lastAccessedNodeIdShort = session.user.preferences?.lastAccessedNodeIdShort
  const hasLastAccessed = lastAccessedNodeIdShort && lastAccessedNodeIdShort !== 'undefined'

  if (hasLastAccessed) {
    // Redirect to last accessed node (normalize to lowercase)
    const normalizedLastAccessed = lastAccessedNodeIdShort.toLowerCase()
    redirect(`/nodes/${normalizedLastAccessed}`)
  }

  // No last accessed node, use root node idShort from session
  const rootNodeIdShort = session.user.rootNodeIdShort
  
  if (!rootNodeIdShort) {
    redirect('/login')
  }

  // Normalize to lowercase for consistent URLs
  const normalizedRootNodeIdShort = rootNodeIdShort.toLowerCase()
  redirect(`/nodes/${normalizedRootNodeIdShort}`)
} 