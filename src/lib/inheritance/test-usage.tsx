/**
 * Simple test component for the simplified inheritance service
 */

import React from 'react'
import { useNodeInheritance } from './service'
import type { BranchContext } from '@/lib/action-client/types'

interface TestInheritanceProps {
  nodeId: string
  branchContext: BranchContext
}

export function TestInheritance({ nodeId, branchContext }: TestInheritanceProps) {
  const inheritance = useNodeInheritance(nodeId, branchContext)

  if (inheritance.isLoading) {
    return (
      <div className="p-4 border border-gray-200 rounded">
        <h3 className="text-lg font-semibold mb-2">Node Inheritance Test</h3>
        <p className="text-gray-600">Loading inheritance data...</p>
      </div>
    )
  }

  if (inheritance.error) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50">
        <h3 className="text-lg font-semibold mb-2 text-red-800">Error Loading Inheritance</h3>
        <p className="text-red-600">{inheritance.error.message}</p>
      </div>
    )
  }

  if (!inheritance.data) {
    return (
      <div className="p-4 border border-gray-200 rounded">
        <h3 className="text-lg font-semibold mb-2">Node Inheritance Test</h3>
        <p className="text-gray-600">No inheritance data available</p>
      </div>
    )
  }

  const { data } = inheritance

  return (
    <div className="p-4 border border-green-200 rounded bg-green-50">
      <h3 className="text-lg font-semibold mb-2 text-green-800">
        Inheritance for: {data.nodeName}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-3 rounded shadow">
          <h4 className="font-medium text-gray-900">Ancestor Chain</h4>
          <p className="text-sm text-gray-600">
            {data.ancestorChain.length} levels deep
          </p>
        </div>
        
        <div className="bg-white p-3 rounded shadow">
          <h4 className="font-medium text-gray-900">Available Processes</h4>
          <p className="text-sm text-gray-600">
            {data.availableProcesses.length} processes
          </p>
        </div>
        
        <div className="bg-white p-3 rounded shadow">
          <h4 className="font-medium text-gray-900">Available Rules</h4>
          <p className="text-sm text-gray-600">
            {data.availableRules.length} rules
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Process Types</h4>
        <div className="flex flex-wrap gap-2">
          {data.processTypes.map((type) => (
            <span
              key={type.id}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
            >
              {type.name} ({type.count})
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Process Names</h4>
        <div className="flex flex-wrap gap-2">
          {data.processNames.map((process) => (
            <span
              key={process.id}
              className={`px-2 py-1 text-xs rounded ${
                process.isInherited
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {process.name} ({process.count} rules)
              {process.isInherited && ' (inherited)'}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-2">Rules Summary</h4>
        <div className="text-sm text-gray-600">
          Direct: {data.availableRules.filter(r => !r.isInherited).length} | 
          Inherited: {data.availableRules.filter(r => r.isInherited).length} | 
          Ignored: {data.availableRules.filter(r => r.isIgnored).length}
        </div>
      </div>
    </div>
  )
}
