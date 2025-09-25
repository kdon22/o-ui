'use client'

import React from 'react'
import { useServerOnlyQuery, useServerOnlyMutation } from '@/hooks/use-server-only-action'

export default function QueuesWorkPage() {
  const { data, refetch } = useServerOnlyQuery('queueEvents.list', {}, {})
  // Use standard update action to change status/locks  
  const updateMsg = useServerOnlyMutation('queueEvents.update', { invalidateQueries: ['queueEvents.list'] })

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Work (Live Jobs)</h2>
      <div className="text-sm">{(data?.data || []).map((j: any) => (
        <div key={j.id} className="border rounded p-2 mb-2 flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium">{j.type}</div>
            <div className="text-xs text-slate-500">{j.status} · {j.lockedBy || 'unassigned'} · {j.createdAt}</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 border rounded" onClick={() => updateMsg.mutate({ id: j.id, updates: { status: 'queued', lockedBy: null, lockedAt: null } })}>Requeue</button>
            <button className="px-2 py-1 border rounded" onClick={() => updateMsg.mutate({ id: j.id, updates: { status: 'cancelled' } })}>Cancel</button>
            <button className="px-2 py-1 border rounded" onClick={() => updateMsg.mutate({ id: j.id, updates: { status: 'failed', lastError: 'Forced timeout' } })}>Force Timeout</button>
          </div>
        </div>
      ))}</div>
    </div>
  )
}


