/**
 * Queue Management - Unified Tab Interface
 * 
 * Five-tab queue management system:
 * 1. Queue List - Live queue monitoring with row actions
 * 2. Job Packages - Distributed job execution monitoring
 * 3. Activity Stream - Real-time job activity and event streaming  
 * 4. Queue Events - Queue-specific event monitoring
 * 5. Scheduled Jobs - Job management and scheduling
 * 
 * Features:
 * - AutoTable-driven with schema-based row actions
 * - Real-time updates and live streaming
 * - Distributed job execution monitoring
 * - Mobile-responsive tabbed interface
 * - Clean architecture with no legacy code
 */

'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AutoTable } from '@/components/auto-generated/table/auto-table';
import { QueueTableWithSummary } from '../components/queue-table-with-summary';
import { sampleQueueData } from '../components/queue-summary-panel';
import { JOB_PACKAGE_SCHEMA, JOB_ACTIVITY_SCHEMA } from '../queues.schema';
import { 
  Activity, 
  Settings, 
  Clock,
  ListChecks,
  Calendar,
  RefreshCw,
  Package,
  PlayCircle
} from 'lucide-react';

interface QueueManagementProps {
  className?: string;
}

export default function QueueManagement({ className }: QueueManagementProps) {
  const [activeTab, setActiveTab] = useState('queues');
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 second polling
  
  // Activity Stream filters
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const handleRefresh = () => {
    // Trigger refresh on all tabs
    window.location.reload(); // Simple refresh for now
  };

  return (
    <div className={`h-screen flex flex-col bg-gray-50 ${className}`}>
      
      {/* Ultra Compact Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            Queue Management
          </h1>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs px-2 py-1">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
              Live ({refreshInterval / 1000}s)
            </Badge>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="h-7 px-2">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Interface */}
      <div className="flex-1 overflow-hidden px-6 pt-2 pb-4">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          
          {/* Spacious Tab Navigation */}
          <div className="mb-3">
            <TabsList className="grid w-full grid-cols-5 lg:w-[1000px] h-12 p-1">
              <TabsTrigger value="queues" className="flex items-center gap-2 text-sm px-3 py-2 pb-3">
                <ListChecks className="h-3.5 w-3.5" />
                Queues
              </TabsTrigger>
              <TabsTrigger value="job-packages" className="flex items-center gap-2 text-sm px-3 py-2 pb-3">
                <Package className="h-3.5 w-3.5" />
                Job Packages
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2 text-sm px-3 py-2 pb-3">
                <Activity className="h-3.5 w-3.5" />
                Activity Stream
              </TabsTrigger>
              <TabsTrigger value="queue-events" className="flex items-center gap-2 text-sm px-3 py-2 pb-3">
                <PlayCircle className="h-3.5 w-3.5" />
                Queue Events
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2 text-sm px-3 py-2 pb-3">
                <Calendar className="h-3.5 w-3.5" />
                Scheduled Jobs
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Queue List */}
          <TabsContent value="queues" className="flex-1 overflow-hidden">
            <QueueTableWithSummary 
              data={sampleQueueData}
              className="h-full"
            />
          </TabsContent>

          {/* Tab 2: Job Packages - Distributed Job Execution */}
          <TabsContent value="job-packages" className="flex-1 overflow-hidden">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Job Packages
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Monitor distributed job execution with full lifecycle tracking
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                    Live Execution
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="h-full overflow-hidden">
                <AutoTable 
                  resourceKey="jobPackages"
                  className="h-full"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Activity Stream - Job Activities */}
          <TabsContent value="activity" className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg">
              {/* Compact Header with Inline Controls */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Live Activity</span>
                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Inline Activity Type Filters */}
                  <div className="flex items-center gap-1 ml-4">
                    <span className="text-xs text-gray-500">Type:</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setActivityTypeFilter('all')}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          activityTypeFilter === 'all'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setActivityTypeFilter('job-lifecycle')}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          activityTypeFilter === 'job-lifecycle'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        Job Lifecycle
                      </button>
                      <button 
                        onClick={() => setActivityTypeFilter('errors')}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          activityTypeFilter === 'errors'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        Errors
                      </button>
                      <button 
                        onClick={() => setActivityTypeFilter('workers')}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          activityTypeFilter === 'workers'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        Workers
                      </button>
                    </div>
                  </div>

                  {/* Inline Severity Filters */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Severity:</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setSeverityFilter('all')}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          severityFilter === 'all'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        All <span className="ml-1 bg-blue-200 px-1 rounded text-xs">4</span>
                      </button>
                      <button 
                        onClick={() => setSeverityFilter('INFO')}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          severityFilter === 'INFO'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        INFO <span className="ml-1 bg-gray-200 px-1 rounded text-xs">3</span>
                      </button>
                      <button 
                        onClick={() => setSeverityFilter('ERROR')}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          severityFilter === 'ERROR'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        ERROR <span className="ml-1 bg-gray-200 px-1 rounded text-xs">1</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-hidden">
                <AutoTable 
                  resourceKey="jobActivities"
                  className="h-full"
                  filteringConfig={{}}
                  customTitle=""
                  level1Filter={activityTypeFilter}
                  level2Filter={severityFilter}
                  onLevel1FilterChange={setActivityTypeFilter}
                  onLevel2FilterChange={setSeverityFilter}
                  customSearchPlaceholder=""
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Queue Events - Original Queue Monitoring */}
          <TabsContent value="queue-events" className="flex-1 overflow-hidden">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-orange-600" />
                      Queue Event Stream  
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Traditional queue event monitoring and processing metrics
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                    <div className="h-2 w-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                    Streaming
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="h-full overflow-hidden">
                <AutoTable 
                  resourceKey="queueEvents"
                  className="h-full"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Scheduled Jobs */}
          <TabsContent value="jobs" className="flex-1 overflow-hidden">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      Scheduled Job Management
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage scheduled jobs, cron expressions, and job execution
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    <Clock className="h-3 w-3 mr-1" />
                    Scheduled
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="h-full overflow-hidden">
                <AutoTable 
                  resourceKey="scheduledJobs"
                  className="h-full"
                />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}