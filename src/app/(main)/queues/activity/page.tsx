'use client'

import React from 'react'
import { useServerOnlyQuery } from '@/hooks/use-server-only-action'

function formatMs(ms: number) {
  if (!isFinite(ms) || ms <= 0) return '0s'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[idx]
}

export default function QueuesActivityPage() {
  const now = new Date()
  const [days, setDays] = React.useState(30)
  const fromIso = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
  const toIso = now.toISOString()

  // Fetch queues and jobs (server-only via schema)
  const { data: queuesRes } = useServerOnlyQuery('queues.list', {}, { refetchInterval: 15000, refetchOnWindowFocus: true })
  const { data: jobsRes } = useServerOnlyQuery(
    'queueEvents.list',
    { filters: { createdAt_gte: fromIso, createdAt_lte: toIso } },
    { refetchInterval: 5000, refetchOnWindowFocus: true }
  )
  const [queueFilter, setQueueFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  const filteredJobs: any[] = React.useMemo(() => {
    return jobs.filter(j => {
      if (queueFilter !== 'all' && (j.queueConfigId || 'unassigned') !== queueFilter) return false
      if (statusFilter !== 'all' && j.status !== statusFilter) return false
      return true
    })
  }, [jobs, queueFilter, statusFilter])

  // CSV export (per-queue metrics)
  const handleExportCsv = React.useCallback(() => {
    const headers = [
      'queueId','queueName','total','completed','failed','successPercent','avgMs','p95Ms','retries','slaBreaches','slaPercent'
    ]
    const rows = Object.values(perQueue).map((q: any) => {
      const cfg = queueById[(q as any).id]
      const name = cfg?.name || ((q as any).id === 'unassigned' ? 'Unassigned' : (q as any).id)
      return [
        (q as any).id,
        name,
        q.total,
        q.completed || 0,
        q.failed || 0,
        q.successRate,
        q.avg,
        q.p95,
        q.retries,
        q.slaBreaches,
        q.slaRate,
      ]
    })
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `queue-metrics-${new Date().toISOString().slice(0,19)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [perQueue, queueById])

  const queues: any[] = Array.isArray(queuesRes?.data) ? (queuesRes!.data as any[]) : []
  const jobs: any[] = Array.isArray(jobsRes?.data) ? (jobsRes!.data as any[]) : []

  const queueById = React.useMemo(() => {
    const map: Record<string, any> = {}
    for (const q of queues) map[q.id] = q
    return map
  }, [queues])

  const totals = React.useMemo(() => {
    const acc = { total: 0, byStatus: {} as Record<string, number>, retries: 0, scheduled: 0, locked: 0 }
    for (const j of filteredJobs) {
      acc.total++
      acc.byStatus[j.status] = (acc.byStatus[j.status] || 0) + 1
      if ((j.retryCount || 0) > 0) acc.retries++
      if (j.scheduledAt && new Date(j.scheduledAt) > now) acc.scheduled++
      if (j.lockedBy) acc.locked++
    }
    return acc
  }, [filteredJobs, now])

  const durations = React.useMemo(() => {
    const proc: number[] = []
    for (const j of filteredJobs) {
      if (j.processedAt) {
        const ms = new Date(j.processedAt).getTime() - new Date(j.createdAt).getTime()
        if (ms > 0) proc.push(ms)
      }
    }
    const avg = proc.length ? Math.round(proc.reduce((a, b) => a + b, 0) / proc.length) : 0
    return { avg, p50: percentile(proc, 50), p95: percentile(proc, 95), samples: proc.length }
  }, [filteredJobs])

  const perQueue = React.useMemo(() => {
    const m: Record<string, any> = {}
    for (const j of filteredJobs) {
      const key = j.queueConfigId || 'unassigned'
      if (!m[key]) m[key] = { id: key, total: 0, completed: 0, failed: 0, in_progress: 0, queued: 0, cancelled: 0, retries: 0, procMs: [] as number[], slaBreaches: 0 }
      const q = m[key]
      q.total++
      q[j.status] = (q[j.status] || 0) + 1
      if ((j.retryCount || 0) > 0) q.retries++
      if (j.processedAt) {
        const ms = new Date(j.processedAt).getTime() - new Date(j.createdAt).getTime()
        if (ms > 0) q.procMs.push(ms)
      }
      const cfg = queueById[key]
      const slaMin = cfg?.slaTargetMinutes || 0
      if (slaMin > 0) {
        const end = j.processedAt ? new Date(j.processedAt) : now
        const ageMs = end.getTime() - new Date(j.createdAt).getTime()
        if (ageMs > slaMin * 60 * 1000) q.slaBreaches++
      }
    }
    // finalize
    Object.values(m).forEach((q: any) => {
      const avg = q.procMs.length ? Math.round(q.procMs.reduce((a: number, b: number) => a + b, 0) / q.procMs.length) : 0
      q.avg = avg
      q.p95 = percentile(q.procMs, 95)
      q.successRate = q.total ? Math.round(((q.completed || 0) / q.total) * 100) : 0
      q.slaRate = q.total ? Math.round((q.slaBreaches / q.total) * 100) : 0
    })
    return m
  }, [filteredJobs, queueById, now])

  const throughput = React.useMemo(() => {
    const byDay: Record<string, number> = {}
    for (const j of filteredJobs) {
      if (j.processedAt) {
        const d = new Date(j.processedAt)
        const key = d.toISOString().slice(0, 10)
        byDay[key] = (byDay[key] || 0) + 1
      }
    }
    const days = Object.keys(byDay).sort()
    return days.map(d => ({ day: d, count: byDay[d] }))
  }, [filteredJobs])

  // Lock age (for visibility into stuck work)
  const avgLockAge = React.useMemo(() => {
    const ages: number[] = []
    for (const j of filteredJobs) {
      if (j.lockedAt && !j.processedAt) {
        const ms = now.getTime() - new Date(j.lockedAt).getTime()
        if (ms > 0) ages.push(ms)
      }
    }
    if (!ages.length) return 0
    return Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
  }, [filteredJobs, now])

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Activity Monitor</h2>
        <div className="flex items-center gap-3 text-sm">
          <span>Range:</span>
          <select className="border rounded px-2 py-1" value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
          </select>
          <span>Queue:</span>
          <select className="border rounded px-2 py-1" value={queueFilter} onChange={e => setQueueFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="unassigned">Unassigned</option>
            {queues.map(q => (
              <option key={q.id} value={q.id}>{q.name}</option>
            ))}
          </select>
          <span>Status:</span>
          <select className="border rounded px-2 py-1" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="queued">Queued</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="border rounded px-3 py-1" onClick={handleExportCsv}>Export CSV</button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
        <div className="border rounded p-3"><div className="text-slate-500">Total</div><div className="text-lg font-semibold">{totals.total}</div></div>
        <div className="border rounded p-3"><div className="text-slate-500">Queued</div><div className="text-lg font-semibold">{totals.byStatus['queued'] || 0}</div></div>
        <div className="border rounded p-3"><div className="text-slate-500">In Progress</div><div className="text-lg font-semibold">{totals.byStatus['in_progress'] || 0}</div></div>
        <div className="border rounded p-3"><div className="text-slate-500">Completed</div><div className="text-lg font-semibold">{totals.byStatus['completed'] || 0}</div></div>
        <div className="border rounded p-3"><div className="text-slate-500">Failed</div><div className="text-lg font-semibold">{totals.byStatus['failed'] || 0}</div></div>
        <div className="border rounded p-3"><div className="text-slate-500">Cancelled</div><div className="text-lg font-semibold">{totals.byStatus['cancelled'] || 0}</div></div>
      </div>

      {/* Reliability & Performance */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
        <div className="border rounded p-3"><div className="text-slate-500">Scheduled Backlog</div><div className="text-lg font-semibold">{totals.scheduled}</div></div>
        <div className="border rounded p-3"><div className="text-slate-500">Retries</div><div className="text-lg font-semibold">{totals.retries}</div></div>
        <div className="border rounded p-3"><div className="text-slate-500">Locked</div><div className="text-lg font-semibold">{totals.locked}</div></div>
        <div className="border rounded p-3"><div className="text-slate-500">Avg Proc</div><div className="text-lg font-semibold">{formatMs(durations.avg)}</div></div>
        <div className="border rounded p-3"><div className="text-slate-500">P95 Proc</div><div className="text-lg font-semibold">{formatMs(durations.p95)}</div></div>
        <div className="border rounded p-3"><div className="text-slate-500">Avg Lock Age</div><div className="text-lg font-semibold">{formatMs(avgLockAge)}</div></div>
      </div>

      {/* Per-Queue Metrics */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Per-Queue Metrics</div>
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-2">Queue</th>
                <th className="text-right p-2">Total</th>
                <th className="text-right p-2">Completed</th>
                <th className="text-right p-2">Failed</th>
                <th className="text-right p-2">Success %</th>
                <th className="text-right p-2">Avg Proc</th>
                <th className="text-right p-2">P95 Proc</th>
                <th className="text-right p-2">Retries</th>
                <th className="text-right p-2">SLA Breaches</th>
                <th className="text-right p-2">SLA %</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(perQueue).map((q: any) => {
                const cfg = queueById[q.id]
                const name = cfg?.name || (q.id === 'unassigned' ? 'Unassigned' : q.id)
                return (
                  <tr key={q.id} className="border-t">
                    <td className="p-2">{name}</td>
                    <td className="p-2 text-right">{q.total}</td>
                    <td className="p-2 text-right">{q.completed || 0}</td>
                    <td className="p-2 text-right">{q.failed || 0}</td>
                    <td className="p-2 text-right">{q.successRate}%</td>
                    <td className="p-2 text-right">{formatMs(q.avg)}</td>
                    <td className="p-2 text-right">{formatMs(q.p95)}</td>
                    <td className="p-2 text-right">{q.retries}</td>
                    <td className="p-2 text-right">{q.slaBreaches}</td>
                    <td className="p-2 text-right">{q.slaRate}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Throughput by Day */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Throughput (Completed per Day)</div>
        <div className="space-y-1">
          {throughput.slice(-14).map(row => (
            <div key={row.day} className="flex items-center gap-3 text-xs">
              <div className="w-24 text-slate-600">{row.day}</div>
              <div className="flex-1 bg-slate-100 rounded h-3">
                <div className="bg-teal-500 h-3 rounded" style={{ width: `${Math.min(100, row.count)}%` }} />
              </div>
              <div className="w-10 text-right">{row.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw sample */}
      <details>
        <summary className="cursor-pointer text-sm">Raw sample (first 50)</summary>
        <pre className="text-xs bg-slate-50 p-3 rounded border overflow-auto">{JSON.stringify(jobs.slice(0, 50), null, 2)}</pre>
      </details>
    </div>
  )
}

