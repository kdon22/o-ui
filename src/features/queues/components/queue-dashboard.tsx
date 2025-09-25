'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useActionQuery } from '@/hooks/use-action-api'
import { Queue, QueueEvent } from '../queues.schema'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Play,
  Pause,
  TrendingUp,
  Zap,
  AlertCircle
} from 'lucide-react'
import { QueueEventStream } from './queue-event-stream'
import { QueueAnalytics } from './queue-analytics'

interface QueueDashboardProps {
  tenantId: string
  branchId: string
}

export function QueueDashboard({ tenantId, branchId }: QueueDashboardProps) {
  const [selectedQueueType, setSelectedQueueType] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch queues with real-time updates
  const { data: queues = [], isLoading } = useActionQuery({
    action: 'queues.list',
    payload: { tenantId, branchId },
    options: {
      refetchInterval: autoRefresh ? 5000 : false, // 5 second refresh
      refetchIntervalInBackground: true
    }
  })

  // Filter queues based on selection and search
  const filteredQueues = queues.filter((queue: Queue) => {
    const matchesType = selectedQueueType === 'ALL' || queue.queueType === selectedQueueType
    const matchesSearch = queue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         queue.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch && queue.isActive
  })

  // Group queues by priority/type
  const criticalQueues = filteredQueues.filter((q: Queue) => 
    q.queueType === 'CRITICAL' || q.healthStatus === 'CRITICAL'
  )
  const standardQueues = filteredQueues.filter((q: Queue) => 
    q.queueType === 'STANDARD' || q.queueType === 'VENDOR'
  )
  const routineQueues = filteredQueues.filter((q: Queue) => 
    q.queueType === 'ROUTINE' || q.queueType === 'INTERNAL'
  )

  // Calculate overall system health
  const totalQueues = filteredQueues.length
  const healthyQueues = filteredQueues.filter((q: Queue) => q.healthStatus === 'HEALTHY').length
  const warningQueues = filteredQueues.filter((q: Queue) => q.healthStatus === 'WARNING').length
  const criticalHealthQueues = filteredQueues.filter((q: Queue) => q.healthStatus === 'CRITICAL').length

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Queue Operations Control Center</h1>
          <p className="text-muted-foreground">Real-time queue monitoring and management</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {autoRefresh ? 'Auto-Refresh: On' : 'Auto-Refresh: Off'}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Healthy Queues</p>
                  <p className="text-2xl font-bold text-green-700">{healthyQueues}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Warning</p>
                  <p className="text-2xl font-bold text-yellow-700">{warningQueues}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Critical</p>
                  <p className="text-2xl font-bold text-red-700">{criticalHealthQueues}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Queues</p>
                  <p className="text-2xl font-bold text-blue-700">{totalQueues}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search queues..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Badge 
            variant={selectedQueueType === 'ALL' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedQueueType('ALL')}
          >
            All ({totalQueues})
          </Badge>
          <Badge 
            variant={selectedQueueType === 'CRITICAL' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedQueueType('CRITICAL')}
          >
            Critical ({criticalQueues.length})
          </Badge>
          <Badge 
            variant={selectedQueueType === 'STANDARD' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedQueueType('STANDARD')}
          >
            Standard ({standardQueues.length})
          </Badge>
          <Badge 
            variant={selectedQueueType === 'ROUTINE' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedQueueType('ROUTINE')}
          >
            Routine ({routineQueues.length})
          </Badge>
        </div>
      </div>

      {/* Queue Flow Visualization */}
      <Tabs defaultValue="flow" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flow">Flow View</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="events">Event Stream</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="space-y-6">
          {/* Critical Operations */}
          {criticalQueues.length > 0 && (
            <QueueSection 
              title="Critical Operations" 
              subtitle="0-15 min" 
              queues={criticalQueues}
              priority="critical"
            />
          )}

          {/* Standard Operations */}
          {standardQueues.length > 0 && (
            <QueueSection 
              title="Standard Operations" 
              subtitle="16-60 min" 
              queues={standardQueues}
              priority="standard"
            />
          )}

          {/* Routine Operations */}
          {routineQueues.length > 0 && (
            <QueueSection 
              title="Routine Operations" 
              subtitle="61+ min" 
              queues={routineQueues}
              priority="routine"
            />
          )}
        </TabsContent>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQueues.map((queue: Queue) => (
              <QueueCard key={queue.id} queue={queue} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events">
          <QueueEventStream tenantId={tenantId} branchId={branchId} />
        </TabsContent>

        <TabsContent value="analytics">
          <QueueAnalytics queues={filteredQueues} tenantId={tenantId} branchId={branchId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface QueueSectionProps {
  title: string
  subtitle: string
  queues: Queue[]
  priority: 'critical' | 'standard' | 'routine'
}

function QueueSection({ title, subtitle, queues, priority }: QueueSectionProps) {
  const priorityColors = {
    critical: 'border-red-200 bg-red-50',
    standard: 'border-yellow-200 bg-yellow-50', 
    routine: 'border-green-200 bg-green-50'
  }

  const priorityTextColors = {
    critical: 'text-red-700',
    standard: 'text-yellow-700',
    routine: 'text-green-700'
  }

  return (
    <Card className={priorityColors[priority]}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={`text-lg ${priorityTextColors[priority]}`}>
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{queues.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {queues.filter(q => q.healthStatus === 'HEALTHY').length}
              </p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {queues.reduce((sum, q) => sum + q.failed, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queues.map((queue) => (
            <QueueFlowCard key={queue.id} queue={queue} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface QueueCardProps {
  queue: Queue
}

function QueueCard({ queue }: QueueCardProps) {
  const healthColor = {
    HEALTHY: 'text-green-600 bg-green-100',
    WARNING: 'text-yellow-600 bg-yellow-100', 
    CRITICAL: 'text-red-600 bg-red-100',
    OFFLINE: 'text-gray-600 bg-gray-100'
  }[queue.healthStatus]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={healthColor} variant="secondary">
                {queue.healthStatus}
              </Badge>
              <Badge variant="outline">{queue.queueType}</Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">#{queue.queueNumber}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <h3 className="font-semibold">{queue.displayName}</h3>
            <p className="text-sm text-muted-foreground">{queue.office}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{queue.monitoring}</p>
                <p className="text-xs text-muted-foreground">Monitoring</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-600">{queue.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-600">{queue.sleeping}</p>
                <p className="text-xs text-muted-foreground">Sleeping</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-600">{queue.pnrsOnQueue}</p>
                <p className="text-xs text-muted-foreground">PNRs</p>
              </div>
            </div>

            {queue.processingRate > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">
                  {queue.processingRate}/min
                </span>
                {queue.averageWaitTime > 0 && (
                  <>
                    <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                    <span className="text-sm text-muted-foreground">
                      ~{Math.round(queue.averageWaitTime / 1000 / 60)}min wait
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function QueueFlowCard({ queue }: QueueCardProps) {
  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{queue.displayName}</h4>
        <Badge 
          variant={queue.healthStatus === 'HEALTHY' ? 'default' : 'destructive'}
          className="text-xs"
        >
          {queue.healthStatus === 'HEALTHY' ? 'Active' : queue.healthStatus}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span>{queue.office}</span>
        <span>#{queue.queueNumber}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-sm font-medium">{queue.monitoring}</span>
        </div>
        
        {queue.failed > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-sm font-medium text-red-600">{queue.failed}</span>
          </div>
        )}
        
        {queue.processingRate > 0 && (
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-600">{queue.processingRate}/m</span>
          </div>
        )}
      </div>
    </div>
  )
}

