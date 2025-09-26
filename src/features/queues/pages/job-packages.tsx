'use client'

import React from 'react'
import { AutoTable } from '@/components/auto-generated/datatable'
import { JOB_PACKAGE_SCHEMA } from '../queues.schema'

/**
 * Job Packages Page
 * Displays all distributed jobs with full lifecycle tracking
 */
export default function JobPackagesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Job Packages</h1>
        <p className="text-muted-foreground">
          Monitor and manage distributed job execution across your infrastructure
        </p>
      </div>
      
      {/* Auto-generated table with all the advanced features */}
      <AutoTable 
        schema={JOB_PACKAGE_SCHEMA}
        defaultSort={{ field: 'queuedAt', order: 'desc' }}
        enableRealtime={true} // Enable real-time updates
        refreshInterval={5000} // Refresh every 5 seconds
      />
    </div>
  )
}
