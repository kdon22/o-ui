'use client'

import React from 'react'
import MainLayout from '@/components/layout/main/main-layout'
import { useParams } from 'next/navigation'
import { useNodeIdResolver } from '@/lib/utils/entity-id-resolver'

export default function NodesLayout({ children }: { children: React.ReactNode }) {
  // Persist MainLayout across node route changes and drive selection from URL
  const params = useParams() as { nodeId?: string | string[] }
  const nodeIdShort = Array.isArray(params?.nodeId) ? params.nodeId[0] : params?.nodeId
  const { fullId } = useNodeIdResolver(nodeIdShort || '')

  return <MainLayout initialSelectedNodeId={fullId || null} />
}


