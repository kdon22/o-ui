'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useActionQuery } from '@/hooks/use-action-api'
import { Queue, QueueAnalytics as QueueAnalyticsData } from '../queues.schema'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  AlertTriangle,
  Target,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw
} from 'lucide-react'

interface QueueAnalyticsProps {
  queues: Queue[]
  tenantId?: string
  branchId?: string
}

export function QueueAnalytics({ queues, tenantId, branchId }: QueueAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h')
  const [selectedQueue, setSelectedQueue] = useState<string>('ALL')
  const [refreshing, setRefreshing] = useState(false)

  // Filter queues based on selection
  const filteredQueues = selectedQueue === 'ALL' 
    ? queues 
    : queues.filter(q => q.id === selectedQueue)

  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    const totalMonitoring = filteredQueues.reduce((sum, q) => sum + q.monitoring, 0)
    const totalFailed = filteredQueues.reduce((sum, q) => sum + q.failed, 0)
    const totalPNRs = filteredQueues.reduce((sum, q) => sum + q.pnrsOnQueue, 0)
    const avgProcessingRate = filteredQueues.reduce((sum, q) => sum + q.processingRate, 0) / Math.max(filteredQueues.length, 1)
    const avgWaitTime = filteredQueues.reduce((sum, q) => sum + q.averageWaitTime, 0) / Math.max(filteredQueues.length, 1)

    const healthyQueues = filteredQueues.filter(q => q.healthStatus === 'HEALTHY').length
    const warningQueues = filteredQueues.filter(q => q.healthStatus === 'WARNING').length
    const criticalQueues = filteredQueues.filter(q => q.healthStatus === 'CRITICAL').length
    const offlineQueues = filteredQueues.filter(q => q.healthStatus === 'OFFLINE').length

    const successRate = totalMonitoring > 0 ? ((totalMonitoring - totalFailed) / totalMonitoring * 100) : 100
    const errorRate = totalMonitoring > 0 ? (totalFailed / totalMonitoring * 100) : 0

    return {
      totalMonitoring,
      totalFailed,
      totalPNRs,
      avgProcessingRate,
      avgWaitTime: avgWaitTime / 1000 / 60, // Convert to minutes
      successRate,
      errorRate,
      healthDistribution: {
        healthy: healthyQueues,
        warning: warningQueues,
        critical: criticalQueues,
        offline: offlineQueues
      }
    }
  }, [filteredQueues])

  // Mock time series data (in real app, this would come from API)
  const timeSeriesData = useMemo(() => {
    const hours = selectedTimeRange === '1h' ? 1 : selectedTimeRange === '6h' ? 6 : selectedTimeRange === '24h' ? 24 : selectedTimeRange === '7d' ? 168 : 720
    const points = Math.min(hours, 50) // Limit data points for performance
    
    return Array.from({ length: points }, (_, i) => {
      const time = new Date(Date.now() - (hours - i) * 60 * 60 * 1000)
      return {
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullTime: time.toLocaleString(),
        processed: Math.floor(Math.random() * 100) + 50,
        failed: Math.floor(Math.random() * 20),
        queueSize: Math.floor(Math.random() * 200) + 100,
        processingRate: Math.floor(Math.random() * 30) + 10
      }
    })
  }, [selectedTimeRange])

  // Queue performance data
  const queuePerformanceData = filteredQueues.map(queue => ({
    name: queue.displayName,
    processing: queue.monitoring,
    failed: queue.failed,
    successRate: queue.monitoring > 0 ? ((queue.monitoring - queue.failed) / queue.monitoring * 100) : 100,
    processingRate: queue.processingRate,
    waitTime: queue.averageWaitTime / 1000 / 60 // minutes
  })).sort((a, b) => b.processing - a.processing)

  // Health distribution data for pie chart
  const healthDistributionData = [
    { name: 'Healthy', value: metrics.healthDistribution.healthy, color: '#22c55e' },
    { name: 'Warning', value: metrics.healthDistribution.warning, color: '#eab308' },
    { name: 'Critical', value: metrics.healthDistribution.critical, color: '#ef4444' },
    { name: 'Offline', value: metrics.healthDistribution.offline, color: '#6b7280' }
  ].filter(item => item.value > 0)

  const handleRefresh = async () => {
    setRefreshing(true)
    // In real app, would trigger data refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedQueue} onValueChange={setSelectedQueue}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Queues</SelectItem>
              {queues.map(queue => (
                <SelectItem key={queue.id} value={queue.id}>
                  {queue.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-700">{metrics.successRate.toFixed(1)}%</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {metrics.totalMonitoring - metrics.totalFailed} successful / {metrics.totalMonitoring} total
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Processing Rate</p>
                  <p className="text-2xl font-bold text-green-700">{metrics.avgProcessingRate.toFixed(0)}/min</p>
                  <p className="text-xs text-green-600 mt-1">Average across all queues</p>
                </div>
                <Zap className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Avg Wait Time</p>
                  <p className="text-2xl font-bold text-yellow-700">{metrics.avgWaitTime.toFixed(0)}min</p>
                  <p className="text-xs text-yellow-600 mt-1">Time to processing</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Error Rate</p>
                  <p className="text-2xl font-bold text-red-700">{metrics.errorRate.toFixed(1)}%</p>
                  <p className="text-xs text-red-600 mt-1">{metrics.totalFailed} failed items</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Dashboard */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="detailed" className="gap-2">
            <Activity className="h-4 w-4" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Processing Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Processing Volume Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => `Time: ${value}`}
                      formatter={(value, name) => [value, name === 'processed' ? 'Processed' : 'Failed']}
                    />
                    <Area type="monotone" dataKey="processed" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="failed" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Processing Rate Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Processing Rate Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => `Time: ${value}`}
                      formatter={(value) => [value + '/min', 'Processing Rate']}
                    />
                    <Line type="monotone" dataKey="processingRate" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Queue Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Processing Volume by Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={queuePerformanceData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="processing" fill="#3b82f6" />
                    <Bar dataKey="failed" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Success Rate Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Success Rate by Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={queuePerformanceData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [value.toFixed(1) + '%', 'Success Rate']} />
                    <Bar dataKey="successRate" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Queue Health Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={healthDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {healthDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Health Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Health Metrics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthDistributionData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name} Queues</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">{item.value}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({((item.value / filteredQueues.length) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Queue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Queue Name</th>
                      <th className="text-right p-2">Processing</th>
                      <th className="text-right p-2">Failed</th>
                      <th className="text-right p-2">Success Rate</th>
                      <th className="text-right p-2">Processing Rate</th>
                      <th className="text-right p-2">Avg Wait Time</th>
                      <th className="text-center p-2">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queuePerformanceData.map((queue, index) => (
                      <motion.tr 
                        key={queue.name}
                        className="border-b hover:bg-gray-50"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="p-2 font-medium">{queue.name}</td>
                        <td className="p-2 text-right text-blue-600">{queue.processing}</td>
                        <td className="p-2 text-right text-red-600">{queue.failed}</td>
                        <td className="p-2 text-right">
                          <Badge variant={queue.successRate >= 95 ? 'default' : queue.successRate >= 90 ? 'secondary' : 'destructive'}>
                            {queue.successRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-2 text-right text-green-600">{queue.processingRate}/min</td>
                        <td className="p-2 text-right">{queue.waitTime.toFixed(0)}min</td>
                        <td className="p-2 text-center">
                          <Badge 
                            variant={
                              filteredQueues.find(q => q.displayName === queue.name)?.healthStatus === 'HEALTHY' ? 'default' :
                              filteredQueues.find(q => q.displayName === queue.name)?.healthStatus === 'WARNING' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {filteredQueues.find(q => q.displayName === queue.name)?.healthStatus}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


