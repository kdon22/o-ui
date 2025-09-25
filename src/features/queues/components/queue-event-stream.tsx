'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useActionQuery } from '@/hooks/use-action-api'
import { QueueEvent } from '../queues.schema'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Search,
  AlertCircle,
  Info,
  Zap,
  Ban,
  RotateCcw,
  Trash2
} from 'lucide-react'

interface QueueEventStreamProps {
  tenantId: string
  branchId: string
  queueId?: string // Optional - show events for specific queue
}

export function QueueEventStream({ tenantId, branchId, queueId }: QueueEventStreamProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Fetch events with real-time updates
  const { data: events = [], isLoading } = useActionQuery({
    action: 'queueEvents.list',
    payload: { 
      tenantId, 
      branchId,
      ...(queueId && { queueId }),
      limit: 100,
      orderBy: { timestamp: 'desc' }
    },
    options: {
      refetchInterval: isPaused ? false : 2000, // 2 second refresh when not paused
      refetchIntervalInBackground: true
    }
  })

  // Filter events
  const filteredEvents = events.filter((event: QueueEvent) => {
    const matchesSeverity = filterSeverity === 'ALL' || event.severity === filterSeverity
    const matchesSearch = event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.eventType.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSeverity && matchesSearch
  })

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [filteredEvents, autoScroll])

  const severityCounts = {
    INFO: events.filter((e: QueueEvent) => e.severity === 'INFO').length,
    WARNING: events.filter((e: QueueEvent) => e.severity === 'WARNING').length,
    ERROR: events.filter((e: QueueEvent) => e.severity === 'ERROR').length,
    CRITICAL: events.filter((e: QueueEvent) => e.severity === 'CRITICAL').length
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Event Stream
            {!isPaused && (
              <div className="flex items-center gap-1 ml-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-green-600 font-normal">Live</span>
              </div>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant={autoScroll ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              className="gap-2"
            >
              {autoScroll ? 'Auto-Scroll: On' : 'Auto-Scroll: Off'}
            </Button>
            
            <Button
              variant={isPaused ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="gap-2"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Badge 
              variant={filterSeverity === 'ALL' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterSeverity('ALL')}
            >
              All ({events.length})
            </Badge>
            <Badge 
              variant={filterSeverity === 'CRITICAL' ? 'destructive' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterSeverity('CRITICAL')}
            >
              Critical ({severityCounts.CRITICAL})
            </Badge>
            <Badge 
              variant={filterSeverity === 'ERROR' ? 'destructive' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterSeverity('ERROR')}
            >
              Error ({severityCounts.ERROR})
            </Badge>
            <Badge 
              variant={filterSeverity === 'WARNING' ? 'secondary' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterSeverity('WARNING')}
            >
              Warning ({severityCounts.WARNING})
            </Badge>
            <Badge 
              variant={filterSeverity === 'INFO' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterSeverity('INFO')}
            >
              Info ({severityCounts.INFO})
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea ref={scrollAreaRef} className="h-full px-6">
          <AnimatePresence initial={false}>
            <div className="space-y-2 pb-4">
              {filteredEvents.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {isLoading ? 'Loading events...' : 'No events found matching your criteria'}
                </div>
              ) : (
                filteredEvents.map((event: QueueEvent, index: number) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: Math.min(index * 0.1, 1) // Stagger up to 1 second
                    }}
                  >
                    <QueueEventCard event={event} />
                  </motion.div>
                ))
              )}
            </div>
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface QueueEventCardProps {
  event: QueueEvent
}

function QueueEventCard({ event }: QueueEventCardProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'ITEM_ADDED':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'ITEM_PROCESSED':
        return <Zap className="h-4 w-4 text-green-500" />
      case 'ITEM_FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'QUEUE_PAUSED':
        return <Pause className="h-4 w-4 text-yellow-500" />
      case 'QUEUE_RESUMED':
        return <Play className="h-4 w-4 text-green-500" />
      case 'QUEUE_CLEARED':
        return <Trash2 className="h-4 w-4 text-gray-500" />
      case 'STATUS_CHANGED':
        return <RotateCcw className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'ERROR':
        return 'bg-red-50 border-red-200 text-red-700'
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'INFO':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive">Critical</Badge>
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>
      case 'WARNING':
        return <Badge variant="secondary">Warning</Badge>
      case 'INFO':
      default:
        return <Badge variant="default">Info</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now'
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <motion.div
      className={`border rounded-lg p-3 ${getSeverityColor(event.severity)}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.1 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          {getEventIcon(event.eventType)}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {event.eventType.replace(/_/g, ' ').toLowerCase()
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </span>
              {getSeverityBadge(event.severity)}
            </div>
            
            <p className="text-sm opacity-90 leading-relaxed">
              {event.message}
            </p>
            
            {/* Event Data Details */}
            {Object.keys(event.eventData).length > 0 && (
              <div className="mt-2 text-xs opacity-75">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(event.eventData).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-medium">{key}:</span>
                      <span className="truncate ml-2">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-3">
          <Clock className="h-3 w-3 opacity-50" />
          <span className="text-xs opacity-75 whitespace-nowrap">
            {formatTimestamp(event.timestamp)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
