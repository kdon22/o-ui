/**
 * Queue Management - Unified Tab Interface
 * 
 * Three-tab queue management system:
 * 1. Queue List - Live queue monitoring with row actions
 * 2. Activity Stream - Real-time event streaming  
 * 3. Scheduled Jobs - Job management and scheduling
 * 
 * Features:
 * - AutoTable-driven with schema-based row actions
 * - Real-time updates and live streaming
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
import { 
  Activity, 
  Settings, 
  Clock,
  ListChecks,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface QueueManagementProps {
  className?: string;
}

export default function QueueManagement({ className }: QueueManagementProps) {
  const [activeTab, setActiveTab] = useState('queues');
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 second polling

  const handleRefresh = () => {
    // Trigger refresh on all tabs
    window.location.reload(); // Simple refresh for now
  };

  return (
    <div className={`h-screen flex flex-col bg-gray-50 ${className}`}>
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Queue Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Live queue monitoring, activity streaming, and job scheduling
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              <span>Live updates: {refreshInterval / 1000}s</span>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Interface */}
      <div className="flex-1 overflow-hidden p-6">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          
          {/* Tab Navigation */}
          <div className="mb-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
              <TabsTrigger value="queues" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Queue List
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Stream
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Scheduled Jobs
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Queue List */}
          <TabsContent value="queues" className="flex-1 overflow-hidden">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-blue-600" />
                      Live Queue Status
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Monitor and control individual queue operations with real-time actions
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="h-full overflow-hidden">
                <AutoTable 
                  resourceKey="queues"
                  className="h-full"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Activity Stream */}
          <TabsContent value="activity" className="flex-1 overflow-hidden">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-orange-600" />
                      Live Activity Stream
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Real-time event monitoring and processing metrics
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

          {/* Tab 3: Scheduled Jobs */}
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