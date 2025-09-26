'use client'

import React from 'react'
import { AutoTable } from '@/components/auto-generated/datatable'
import { JOB_ACTIVITY_SCHEMA } from '../queues.schema'

/**
 * Activity Stream Page
 * Real-time activity feed for job execution monitoring
 */
export default function ActivityStreamPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Activity Stream</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of job activities, worker assignments, and system events
        </p>
      </div>
      
      {/* Real-time activity stream with advanced filtering */}
      <AutoTable 
        schema={JOB_ACTIVITY_SCHEMA}
        defaultSort={{ field: 'createdAt', order: 'desc' }}
        enableRealtime={true} // Enable real-time updates
        refreshInterval={3000} // Refresh every 3 seconds for activity stream
        defaultFilters={{
          'activityType': 'all',
          'severity': 'all',
          'isVisible': true
        }}
        streamMode={true} // Enable streaming mode for continuous updates
      />
    </div>
  )
}
