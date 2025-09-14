'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useActionQuery } from '@/hooks/use-action-api'
import { useRuleIdResolver } from '@/lib/utils/entity-id-resolver'
import dynamic from 'next/dynamic'

// 🚀 **PERFORMANCE FIX**: Lazy load heavy editor system
const EditorLayout = dynamic(
  () => import('@/components/layout/editor/editor-layout'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
            <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mx-auto mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
            <div className="text-sm text-muted-foreground mt-4">Loading rule editor...</div>
          </div>
        </div>
      </div>
    )
  }
)
import { ExtendedRule } from '@/components/layout/editor/types'

interface RuleEditPageProps {
  params: Promise<{ ruleId: string }>
}

export default function RuleEditPage({ params }: RuleEditPageProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Handle async params properly for Next.js 15.5+
  const [ruleIdShort, setRuleIdShort] = useState<string | null>(null)
  
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params
        setRuleIdShort(resolvedParams.ruleId)
      } catch (error) {
        console.error('Error resolving params:', error)
        setRuleIdShort(null)
      }
    }
    
    resolveParams()
  }, [params])
  
  // Get branch from URL params, default to 'main'
  const branchParam = searchParams.get('branch')
  const branch = branchParam || 'main'

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rule, setRule] = useState<ExtendedRule | null>(null)

  // 🔥 Resolve idShort to real ID (only when ruleIdShort is available)
  const { fullId: ruleId, isResolving: isResolvingId, error: resolveError } = useRuleIdResolver(ruleIdShort || '');

  // Load rule data using the action system (only after ID is resolved)
  // 🚀 PERFORMANCE: Single data fetch for entire rule page
  const { data: ruleData, isLoading: isLoadingRule, error: ruleError } = useActionQuery(
    'rule.read',
    { id: ruleId, branch },
    { 
      enabled: !!ruleId && !!ruleIdShort, // Only fetch when we have both the real ID and resolved params
      staleTime: 30000, // Cache for 30 seconds to prevent redundant fetches
      refetchOnWindowFocus: false // Don't refetch when switching tabs
    }
  )

  useEffect(() => {

    // If user navigated with a full UUID, redirect to canonical shortId URL
    // Keep query params (e.g., branch) intact
    if (ruleIdShort && ruleIdShort.includes('-') && ruleData?.data?.idShort) {
      const qp = searchParams.toString()
      const suffix = qp ? `?${qp}` : ''
      router.replace(`/rules/${ruleData.data.idShort}${suffix}`)
      return
    }

    // State update - silent

    // Show loading while resolving params, ID, or loading rule data
    if (!ruleIdShort || isResolvingId || isLoadingRule) {
      setIsLoading(true)
      return
    }

    // Handle ID resolution errors
    if (resolveError) {
      setError(`Failed to find rule: ${resolveError.message || 'Rule not found'}`)
      setIsLoading(false)
      return
    }

    // Handle rule loading errors
    if (ruleError) {
      setError(`Failed to load rule: ${ruleError.message || 'Unknown error'}`)
      setIsLoading(false)
      return
    }

    if (ruleData?.data) {
      // Transform the rule data to ExtendedRule format expected by editor
      const ruleContent = ruleData.data.sourceCode || ruleData.data.content || ruleData.data.code || ''
      
      // 🔍 DEBUG: Log what fields we're receiving from API
      console.log('🔍 [RuleEditPage] API Response Fields:', {
        hasSourceCode: !!ruleData.data.sourceCode,
        hasSourceMap: !!ruleData.data.sourceMap,
        hasPythonCode: !!ruleData.data.pythonCode,
        sourceMapType: typeof ruleData.data.sourceMap,
        apiResponseKeys: Object.keys(ruleData.data),
        sourceMapPreview: ruleData.data.sourceMap ? {
          version: ruleData.data.sourceMap.version,
          hasStatements: !!ruleData.data.sourceMap.statements,
          statementsCount: ruleData.data.sourceMap.statements?.length
        } : null
      })
      
      const transformedRule: ExtendedRule = {
        id: ruleData.data.id,
        name: ruleData.data.name || 'Untitled Rule',
        description: ruleData.data.description,
        code: ruleContent,
        content: ruleContent, // For Monaco editor compatibility
        type: ruleData.data.type || 'validation',
        isActive: ruleData.data.isActive ?? true,
        version: ruleData.data.version || 1,
        tenantId: ruleData.data.tenantId,
        createdAt: ruleData.data.createdAt,
        updatedAt: ruleData.data.updatedAt,
        createdBy: ruleData.data.createdBy,
        updatedBy: ruleData.data.updatedBy,
        branchId: ruleData.data.branchId || branch,
        
        // 🗺️ **CRITICAL FIX**: Include sourceMap and related fields
        sourceCode: ruleData.data.sourceCode,
        sourceMap: ruleData.data.sourceMap,
        pythonCode: ruleData.data.pythonCode,
        pythonCodeHash: ruleData.data.pythonCodeHash,
        pythonName: ruleData.data.pythonName,
        sourceMapGeneratedAt: ruleData.data.sourceMapGeneratedAt
      }
      setRule(transformedRule)
      setError(null)
    } else if (!isLoadingRule) {
      setError('Rule not found')
    }

    setIsLoading(false)
  }, [ruleData, isLoadingRule, ruleError, isResolvingId, resolveError, branch, ruleIdShort, router, searchParams])

  // Show loading state while params are being resolved
  if (!ruleIdShort) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Resolving rule...</p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading rule...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <h3 className="text-lg font-semibold mb-2">Rule Not Found</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Branch: <span className="font-mono">{branch}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <EditorLayout 
      ruleId={ruleId}
      ruleIdShort={ruleIdShort}
      initialRule={rule}
    />
  )
} 