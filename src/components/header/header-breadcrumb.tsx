'use client'

import { useMemo } from 'react'
import { Breadcrumb } from '@/components/ui/bread-crumb'
import { useResourceItem } from '@/hooks/use-action-api'

interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

export interface HeaderBreadcrumbProps {
  selectedNodeId: string | null
  currentTenant?: any
}

export function HeaderBreadcrumb({ 
  selectedNodeId, 
  currentTenant 
}: HeaderBreadcrumbProps) {
  // Fetch current node data to build breadcrumb path
  const { data: nodeData } = useResourceItem(
    'node',
    selectedNodeId || '',
    {
      enabled: !!selectedNodeId,
      staleTime: 2 * 60 * 1000,
      fallbackToCache: true
    }
  )

  // Build breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = []
    
    // Add tenant as root
    if (currentTenant) {
      items.push({
        label: currentTenant.name,
        onClick: () => {
          // TODO: Navigate to tenant home
        }
      })
    }
    
    // Add node information
    if (selectedNodeId) {
      const nodeLabel = nodeData?.data?.name ? `Node: ${nodeData.data.name}` : `Node: ${selectedNodeId}`
      items.push({
        label: nodeLabel,
        onClick: () => {
          // TODO: Navigate to node
          console.log('Navigate to node:', selectedNodeId)
        }
      })
    }
    
    return items
  }, [currentTenant, nodeData, selectedNodeId])

  // Don't render if no meaningful breadcrumb
  if (breadcrumbItems.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">O-UI</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-lg font-semibold">O-UI</span>
      <span className="text-muted-foreground">/</span>
      <Breadcrumb 
        items={breadcrumbItems}
        onClick={(item: BreadcrumbItem) => item.onClick?.()}
      />
    </div>
  )
}