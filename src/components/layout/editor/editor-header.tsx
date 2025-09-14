'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  X
} from 'lucide-react'
import { ExtendedRule, ExtendedClass } from './types'
import { useSession } from 'next-auth/react'
import { EditorPreferencesModal } from './editor-preferences'

interface EditorHeaderProps {
  rule?: ExtendedRule | null
  class?: ExtendedClass | null
  onSearch: (query: string) => void
  hasUnsavedChanges: boolean
  resourceType?: 'rule' | 'class'
}

export function EditorHeader({ 
  rule, 
  class: classEntity,
  onSearch, 
  hasUnsavedChanges,
  resourceType = 'rule'
}: EditorHeaderProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  // Determine current entity based on resource type
  const currentEntity = resourceType === 'rule' ? rule : classEntity
  const entityName = currentEntity?.name || `Untitled ${resourceType === 'rule' ? 'Rule' : 'Class'}`

  // Fix hydration issues with icons
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch(value)
  }

  const handleCloseEditor = async () => {
    // Best-effort save current editors before closing (does not block if absent)
    try {
      const saveHook = (window as any).__orpoc_saveOnClose
      if (typeof saveHook === 'function') {
        await saveHook()
      }
    } catch {}

    // Navigate back to the last accessed node or root
    const lastNodeIdShort = session?.user?.preferences?.lastAccessedNodeIdShort
    const rootNodeIdShort = session?.user?.rootNodeIdShort
    
    const targetNode = lastNodeIdShort || rootNodeIdShort
    
    if (targetNode) {
      router.push(`/nodes/${targetNode}`)
    } else {
      // Fallback to main layout root
      router.push('/')
    }
  }

  const renderEntityBadges = () => {
    if (!currentEntity) return null

    if (resourceType === 'rule' && rule) {
      return (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs">
            {rule.type}
          </Badge>
          <Badge variant={rule.isActive ? 'default' : 'secondary'} className="text-xs">
            {rule.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <span className="text-xs text-gray-500">v{rule.version}</span>
        </div>
      )
    } else if (resourceType === 'class' && classEntity) {
      return (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs">
            {classEntity.category}
          </Badge>
          <Badge variant={classEntity.isActive ? 'default' : 'secondary'} className="text-xs">
            {classEntity.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {classEntity.isAbstract && (
            <Badge variant="secondary" className="text-xs">
              Abstract
            </Badge>
          )}
          <span className="text-xs text-gray-500">v{classEntity.version}</span>
        </div>
      )
    }
    
    return null
  }

  return (
    <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
      {/* Left side - Entity info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
            {entityName}
          </h1>
          {renderEntityBadges()}
        </div>
        
        {hasUnsavedChanges && (
          <div className="flex items-center gap-1 text-orange-600">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Auto-saving...</span>
          </div>
        )}
      </div>

      {/* Center - Universal search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          {mounted && (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          )}
          <Input
            placeholder={`Search across all ${resourceType}s and resources...`}
            value={searchQuery}
            onChange={handleSearchChange}
            className={`${mounted ? 'pl-10' : 'pl-3'} bg-gray-50 border-gray-200 focus:bg-white`}
          />
        </div>
      </div>

      {/* Right side - Editor Preferences + Close */}
      <div className="flex items-center gap-2">
        {/* Editor Preferences Modal */}
        <EditorPreferencesModal />

        {/* Close Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleCloseEditor}
          className="text-gray-600 hover:text-gray-900"
        >
          {mounted && <X className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
} 