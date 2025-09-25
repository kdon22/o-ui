/**
 * Queue Management - Unified Tab Interface
 * 
 * Complete queue management system with three integrated tabs:
 * - Queue List: Live queue monitoring with row actions  
 * - Activity Stream: Real-time event streaming and metrics
 * - Scheduled Jobs: Job management and cron scheduling
 * 
 * Features:
 * - AutoTable-driven with schema-based row actions
 * - Real-time updates and live streaming
 * - Clean architecture with no legacy code
 */

import QueueManagement from '@/features/queues/pages/queue-management'

export default function QueuesPage() {
  return <QueueManagement />
}


