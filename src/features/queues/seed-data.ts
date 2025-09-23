/**
 * Travel Queue Management - Seed Data
 * 
 * Realistic travel operations data showing frequency-based priority system:
 * - Critical: 0-15 minutes (ticketing, payments, urgent)
 * - Standard: 16-60 minutes (seating, upgrades, waitlist) 
 * - Routine: 61+ minutes (reporting, cleanup, maintenance)
 */

import type { QueueConfig, QueueMessage, QueueWorker } from './queues.schema';

const now = new Date();
const tenantId = 'tenant-demo-123';

// Helper to generate timestamps
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();
const minutesFromNow = (minutes: number) => new Date(now.getTime() + minutes * 60 * 1000).toISOString();

// ============================================================================
// QUEUE CONFIGURATIONS - Frequency-Based Priority System
// ============================================================================

export const QUEUE_CONFIGS_SEED_DATA: QueueConfig[] = [
  // ========== CRITICAL OPERATIONS (0-15 minutes) ==========
  {
    id: 'queue-001',
    tenantId,
    name: 'ticketing-urgent',
    displayName: 'Ticketing - Urgent Processing',
    description: 'Critical ticketing operations requiring immediate attention',
    type: 'GDS',
    priority: 'critical',
    frequencyMinutes: 2,
    scheduleExpression: '*/2 * * * *', // Every 2 minutes
    gdsSystem: 'amadeus',
    gdsQueue: 'Q/9',
    gdsOffice: '13Q1',
    processId: 'process-ticketing-urgent',
    workflowId: 'workflow-urgent-processing',
    officeId: 'office-london-city',
    maxRetries: 3,
    timeoutMinutes: 5,
    concurrentLimit: 2,
    status: 'active',
    sleepUntil: null,
    pauseReason: null,
    lastRun: minutesAgo(1),
    nextRun: minutesFromNow(1),
    averageRunTime: 45000, // 45 seconds in milliseconds
    successRate: 98.5,
    isDeleted: false,
    createdAt: minutesAgo(1440), // Created 1 day ago
    updatedAt: minutesAgo(1),
    createdById: 'user-admin',
    updatedById: 'system'
  },
  {
    id: 'queue-002', 
    tenantId,
    name: 'payment-failures',
    displayName: 'Payment Failures - Critical',
    description: 'Failed payment processing requiring immediate resolution',
    type: 'Virtual',
    priority: 'critical',
    frequencyMinutes: 5,
    scheduleExpression: '*/5 * * * *', // Every 5 minutes
    gdsSystem: null,
    gdsQueue: null,
    gdsOffice: null,
    processId: 'process-payment-recovery',
    workflowId: 'workflow-payment-failures',
    officeId: 'office-london-city',
    maxRetries: 5,
    timeoutMinutes: 8,
    concurrentLimit: 1,
    status: 'active',
    sleepUntil: null,
    pauseReason: null,
    lastRun: minutesAgo(3),
    nextRun: minutesFromNow(2),
    averageRunTime: 120000, // 2 minutes
    successRate: 87.2,
    isDeleted: false,
    createdAt: minutesAgo(2160), // Created 1.5 days ago
    updatedAt: minutesAgo(3),
    createdById: 'user-ops-manager',
    updatedById: 'system'
  },
  {
    id: 'queue-003',
    tenantId,
    name: 'urgent-queue-amadeus',
    displayName: 'Amadeus Urgent Queue (Q/URGENT)',
    description: 'Emergency travel changes and cancellations',
    type: 'GDS',
    priority: 'critical',
    frequencyMinutes: 10,
    scheduleExpression: '*/10 * * * *', // Every 10 minutes
    gdsSystem: 'amadeus',
    gdsQueue: 'Q/URGENT',
    gdsOffice: '1SUB',
    processId: 'process-emergency-changes',
    workflowId: 'workflow-urgent-travel',
    officeId: 'office-manchester',
    maxRetries: 3,
    timeoutMinutes: 12,
    concurrentLimit: 1,
    status: 'active',
    sleepUntil: null,
    pauseReason: null,
    lastRun: minutesAgo(8),
    nextRun: minutesFromNow(2),
    averageRunTime: 180000, // 3 minutes
    successRate: 94.1,
    isDeleted: false,
    createdAt: minutesAgo(720), // Created 12 hours ago
    updatedAt: minutesAgo(8),
    createdById: 'user-tech-lead',
    updatedById: 'system'
  },
  {
    id: 'queue-004',
    tenantId,
    name: 'cancellation-processing',
    displayName: 'Cancellation Processing',
    description: 'Time-sensitive travel cancellations',
    type: 'Virtual',
    priority: 'critical',
    frequencyMinutes: 15,
    scheduleExpression: '*/15 * * * *', // Every 15 minutes
    gdsSystem: null,
    gdsQueue: null,
    gdsOffice: null,
    processId: 'process-cancellations',
    workflowId: 'workflow-cancel-bookings',
    officeId: 'office-london-city',
    maxRetries: 2,
    timeoutMinutes: 10,
    concurrentLimit: 3,
    status: 'active',
    sleepUntil: null,
    pauseReason: null,
    lastRun: minutesAgo(12),
    nextRun: minutesFromNow(3),
    averageRunTime: 90000, // 1.5 minutes
    successRate: 91.8,
    isDeleted: false,
    createdAt: minutesAgo(1080), // Created 18 hours ago
    updatedAt: minutesAgo(12),
    createdById: 'user-ops-manager',
    updatedById: 'system'
  },

  // ========== STANDARD OPERATIONS (16-60 minutes) ==========
  {
    id: 'queue-005',
    tenantId,
    name: 'seat-assignments',
    displayName: 'Seat Assignment Processing',
    description: 'Regular seat assignment updates and preferences',
    type: 'Virtual',
    priority: 'standard', 
    frequencyMinutes: 30,
    scheduleExpression: '*/30 * * * *', // Every 30 minutes
    gdsSystem: null,
    gdsQueue: null,
    gdsOffice: null,
    processId: 'process-seat-management',
    workflowId: 'workflow-seating',
    officeId: 'office-manchester',
    maxRetries: 2,
    timeoutMinutes: 15,
    concurrentLimit: 2,
    status: 'active',
    sleepUntil: null,
    pauseReason: null,
    lastRun: minutesAgo(25),
    nextRun: minutesFromNow(5),
    averageRunTime: 240000, // 4 minutes
    successRate: 96.3,
    isDeleted: false,
    createdAt: minutesAgo(2880), // Created 2 days ago
    updatedAt: minutesAgo(25),
    createdById: 'user-config-manager',
    updatedById: 'system'
  },
  {
    id: 'queue-006',
    tenantId,
    name: 'upgrade-processing',
    displayName: 'Upgrade Request Processing',
    description: 'Customer upgrade requests and availability checks',
    type: 'GDS',
    priority: 'standard',
    frequencyMinutes: 45,
    scheduleExpression: '*/45 * * * *', // Every 45 minutes
    gdsSystem: 'sabre',
    gdsQueue: 'UPGRADES',
    gdsOffice: '20DM',
    processId: 'process-upgrades',
    workflowId: 'workflow-upgrade-processing',
    officeId: 'office-birmingham',
    maxRetries: 3,
    timeoutMinutes: 20,
    concurrentLimit: 1,
    status: 'active',
    sleepUntil: null,
    pauseReason: null,
    lastRun: minutesAgo(40),
    nextRun: minutesFromNow(5),
    averageRunTime: 600000, // 10 minutes
    successRate: 89.7,
    isDeleted: false,
    createdAt: minutesAgo(4320), // Created 3 days ago
    updatedAt: minutesAgo(40),
    createdById: 'user-travel-ops',
    updatedById: 'system'
  },
  {
    id: 'queue-007',
    tenantId,
    name: 'waitlist-management',
    displayName: 'Waitlist Management',
    description: 'Customer waitlist processing and notifications',
    type: 'Virtual',
    priority: 'standard',
    frequencyMinutes: 60,
    scheduleExpression: '0 * * * *', // Every hour
    gdsSystem: null,
    gdsQueue: null,
    gdsOffice: null,
    processId: 'process-waitlist',
    workflowId: 'workflow-waitlist-processing',
    officeId: 'office-london-city',
    maxRetries: 1,
    timeoutMinutes: 25,
    concurrentLimit: 1,
    status: 'paused',
    sleepUntil: null,
    pauseReason: 'System maintenance scheduled',
    lastRun: minutesAgo(125),
    nextRun: null, // Paused
    averageRunTime: 480000, // 8 minutes
    successRate: 93.4,
    isDeleted: false,
    createdAt: minutesAgo(7200), // Created 5 days ago
    updatedAt: minutesAgo(65),
    createdById: 'user-ops-manager',
    updatedById: 'user-admin'
  },

  // ========== ROUTINE OPERATIONS (61+ minutes) ==========
  {
    id: 'queue-008',
    tenantId,
    name: 'daily-reporting',
    displayName: 'Daily Operations Reporting',
    description: 'Generate daily operational reports and metrics',
    type: 'Virtual',
    priority: 'routine',
    frequencyMinutes: 240, // 4 hours
    scheduleExpression: '0 */4 * * *', // Every 4 hours
    gdsSystem: null,
    gdsQueue: null,
    gdsOffice: null,
    processId: 'process-reporting',
    workflowId: 'workflow-daily-reports',
    officeId: 'office-head-office',
    maxRetries: 1,
    timeoutMinutes: 45,
    concurrentLimit: 1,
    status: 'active',
    sleepUntil: null,
    pauseReason: null,
    lastRun: minutesAgo(180), // 3 hours ago
    nextRun: minutesFromNow(60), // In 1 hour
    averageRunTime: 1800000, // 30 minutes
    successRate: 99.1,
    isDeleted: false,
    createdAt: minutesAgo(10080), // Created 1 week ago
    updatedAt: minutesAgo(180),
    createdById: 'user-admin',
    updatedById: 'system'
  },
  {
    id: 'queue-009',
    tenantId,
    name: 'fare-monitoring',
    displayName: 'Fare Change Monitoring',
    description: 'Monitor fare changes and price alerts',
    type: 'Virtual',
    priority: 'routine',
    frequencyMinutes: 360, // 6 hours
    scheduleExpression: '0 */6 * * *', // Every 6 hours
    gdsSystem: null,
    gdsQueue: null,
    gdsOffice: null,
    processId: 'process-fare-monitoring',
    workflowId: 'workflow-price-tracking',
    officeId: 'office-pricing-team',
    maxRetries: 2,
    timeoutMinutes: 60,
    concurrentLimit: 1,
    status: 'sleeping',
    sleepUntil: minutesFromNow(180), // Wake in 3 hours
    pauseReason: null,
    lastRun: minutesAgo(420), // 7 hours ago
    nextRun: minutesFromNow(180), // In 3 hours when it wakes
    averageRunTime: 2400000, // 40 minutes
    successRate: 97.8,
    isDeleted: false,
    createdAt: minutesAgo(20160), // Created 2 weeks ago
    updatedAt: minutesAgo(30),
    createdById: 'user-pricing-manager',
    updatedById: 'user-admin'
  },
  {
    id: 'queue-010',
    tenantId,
    name: 'data-cleanup',
    displayName: 'Data Cleanup & Maintenance',
    description: 'Database cleanup and system maintenance tasks',
    type: 'Virtual',
    priority: 'routine',
    frequencyMinutes: 1440, // 24 hours (daily)
    scheduleExpression: '0 2 * * *', // Daily at 2 AM
    gdsSystem: null,
    gdsQueue: null,
    gdsOffice: null,
    processId: 'process-data-cleanup',
    workflowId: 'workflow-system-maintenance',
    officeId: 'office-it-ops',
    maxRetries: 1,
    timeoutMinutes: 120,
    concurrentLimit: 1,
    status: 'active',
    sleepUntil: null,
    pauseReason: null,
    lastRun: minutesAgo(480), // 8 hours ago (ran at 2 AM)
    nextRun: minutesFromNow(960), // Tomorrow at 2 AM (16 hours from now)
    averageRunTime: 3600000, // 1 hour
    successRate: 100.0,
    isDeleted: false,
    createdAt: minutesAgo(43200), // Created 1 month ago
    updatedAt: minutesAgo(480),
    createdById: 'user-system-admin',
    updatedById: 'system'
  },

  // ========== FAILED QUEUE (For demonstration) ==========
  {
    id: 'queue-011',
    tenantId,
    name: 'test-queue-failed',
    displayName: 'Test Queue - Connection Failed',
    description: 'Test queue showing failed connection status',
    type: 'GDS',
    priority: 'critical',
    frequencyMinutes: 5,
    scheduleExpression: '*/5 * * * *',
    gdsSystem: 'amadeus',
    gdsQueue: 'Q/TEST',
    gdsOffice: 'TEST1',
    processId: 'process-test',
    workflowId: 'workflow-test',
    officeId: 'office-test',
    maxRetries: 3,
    timeoutMinutes: 5,
    concurrentLimit: 1,
    status: 'failed',
    sleepUntil: null,
    pauseReason: 'GDS connection timeout - contact IT support',
    lastRun: minutesAgo(25),
    nextRun: null, // Failed, not scheduled
    averageRunTime: null,
    successRate: 12.5,
    isDeleted: false,
    createdAt: minutesAgo(1440),
    updatedAt: minutesAgo(25),
    createdById: 'user-test',
    updatedById: 'system'
  }
];

// ============================================================================
// QUEUE MESSAGES (JOBS) - Realistic Processing Activity 
// ============================================================================

export const QUEUE_MESSAGES_SEED_DATA: QueueMessage[] = [
  // Recent successful ticketing jobs
  {
    id: 'job-001',
    tenantId,
    queueConfigId: 'queue-001', // Ticketing urgent
    jobType: 'gds_queue_check',
    pnr: 'AB4P35',
    gdsLocator: 'AB4P35',
    status: 'completed',
    priority: 1,
    workerId: 'worker-001',
    workerHost: 'worker-london-01',
    scheduledFor: minutesAgo(3),
    startedAt: minutesAgo(2),
    completedAt: minutesAgo(1),
    processingTimeMs: 67000, // 67 seconds
    attemptCount: 1,
    maxAttempts: 3,
    lastError: null,
    jobData: {
      queueName: 'Q/9',
      office: '13Q1',
      expectedUTRs: 3
    },
    result: {
      utrsFound: 3,
      utrsProcessed: 3,
      followUpJobsCreated: 2,
      success: true
    },
    utrCount: 3,
    utrsProcessed: 3,
    followUpJobsCreated: 2,
    createdAt: minutesAgo(5),
    updatedAt: minutesAgo(1)
  },
  {
    id: 'job-002',
    tenantId,
    queueConfigId: 'queue-002', // Payment failures
    jobType: 'virtual_scheduled',
    pnr: 'CD789X',
    gdsLocator: null,
    status: 'completed',
    priority: 1,
    workerId: 'worker-002',
    workerHost: 'worker-london-02',
    scheduledFor: minutesAgo(8),
    startedAt: minutesAgo(7),
    completedAt: minutesAgo(5),
    processingTimeMs: 125000, // 2 minutes 5 seconds
    attemptCount: 1,
    maxAttempts: 5,
    lastError: null,
    jobData: {
      paymentReference: 'PAY-789456',
      customerEmail: 'customer@example.com',
      amount: '£456.78'
    },
    result: {
      paymentRecovered: true,
      customerNotified: true,
      success: true
    },
    utrCount: null,
    utrsProcessed: null,
    followUpJobsCreated: 1,
    createdAt: minutesAgo(10),
    updatedAt: minutesAgo(5)
  },
  
  // Currently processing job
  {
    id: 'job-003',
    tenantId,
    queueConfigId: 'queue-003', // Amadeus urgent
    jobType: 'gds_queue_check',
    pnr: 'EF123G',
    gdsLocator: 'EF123G',
    status: 'processing',
    priority: 1,
    workerId: 'worker-001',
    workerHost: 'worker-london-01',
    scheduledFor: minutesAgo(4),
    startedAt: minutesAgo(3),
    completedAt: null,
    processingTimeMs: null,
    attemptCount: 1,
    maxAttempts: 3,
    lastError: null,
    jobData: {
      queueName: 'Q/URGENT',
      office: '1SUB',
      urgencyLevel: 'high'
    },
    result: null,
    utrCount: 2,
    utrsProcessed: 1,
    followUpJobsCreated: 0,
    createdAt: minutesAgo(6),
    updatedAt: minutesAgo(1)
  },
  
  // Queued jobs waiting to run
  {
    id: 'job-004',
    tenantId,
    queueConfigId: 'queue-005', // Seat assignments
    jobType: 'virtual_scheduled',
    pnr: 'GH456H',
    gdsLocator: null,
    status: 'queued',
    priority: 2,
    workerId: null,
    workerHost: null,
    scheduledFor: minutesFromNow(5),
    startedAt: null,
    completedAt: null,
    processingTimeMs: null,
    attemptCount: 0,
    maxAttempts: 2,
    lastError: null,
    jobData: {
      passengerCount: 4,
      preferenceType: 'aisle',
      flightNumber: 'BA456'
    },
    result: null,
    utrCount: null,
    utrsProcessed: null,
    followUpJobsCreated: null,
    createdAt: minutesAgo(2),
    updatedAt: minutesAgo(2)
  },
  {
    id: 'job-005',
    tenantId,
    queueConfigId: 'queue-004', // Cancellation processing
    jobType: 'virtual_scheduled',
    pnr: 'IJ789K',
    gdsLocator: 'IJ789K',
    status: 'queued',
    priority: 1,
    workerId: null,
    workerHost: null,
    scheduledFor: minutesFromNow(2),
    startedAt: null,
    completedAt: null,
    processingTimeMs: null,
    attemptCount: 0,
    maxAttempts: 2,
    lastError: null,
    jobData: {
      cancellationType: 'full_refund',
      reason: 'customer_request',
      bookingValue: '£1,234.56'
    },
    result: null,
    utrCount: null,
    utrsProcessed: null,
    followUpJobsCreated: null,
    createdAt: minutesFromNow(-1),
    updatedAt: minutesFromNow(-1)
  },
  
  // Failed job requiring attention
  {
    id: 'job-006',
    tenantId,
    queueConfigId: 'queue-011', // Failed test queue
    jobType: 'gds_queue_check',
    pnr: 'TEST123',
    gdsLocator: 'TEST123',
    status: 'failed',
    priority: 1,
    workerId: 'worker-001',
    workerHost: 'worker-london-01',
    scheduledFor: minutesAgo(30),
    startedAt: minutesAgo(25),
    completedAt: minutesAgo(25),
    processingTimeMs: 15000, // Failed quickly
    attemptCount: 3,
    maxAttempts: 3,
    lastError: 'Connection timeout: Unable to connect to Amadeus GDS system. Error code: GDS_TIMEOUT_001',
    jobData: {
      queueName: 'Q/TEST',
      office: 'TEST1'
    },
    result: {
      success: false,
      errorCode: 'GDS_TIMEOUT_001',
      retryRecommended: false
    },
    utrCount: null,
    utrsProcessed: null,
    followUpJobsCreated: null,
    createdAt: minutesAgo(35),
    updatedAt: minutesAgo(25)
  },

  // Long-running routine job
  {
    id: 'job-007',
    tenantId,
    queueConfigId: 'queue-008', // Daily reporting
    jobType: 'virtual_scheduled',
    pnr: null,
    gdsLocator: null,
    status: 'completed',
    priority: 3,
    workerId: 'worker-003',
    workerHost: 'worker-reports-01',
    scheduledFor: minutesAgo(200), // 3+ hours ago
    startedAt: minutesAgo(195),
    completedAt: minutesAgo(165), // Took 30 minutes
    processingTimeMs: 1800000, // 30 minutes
    attemptCount: 1,
    maxAttempts: 1,
    lastError: null,
    jobData: {
      reportType: 'daily_operations',
      dateRange: '2024-01-15',
      includeMetrics: true
    },
    result: {
      reportsGenerated: 5,
      recordsProcessed: 15420,
      success: true
    },
    utrCount: null,
    utrsProcessed: null,
    followUpJobsCreated: 0,
    createdAt: minutesAgo(210),
    updatedAt: minutesAgo(165)
  }
];

// ============================================================================
// QUEUE WORKERS - System Capacity
// ============================================================================

export const QUEUE_WORKERS_SEED_DATA: QueueWorker[] = [
  {
    id: 'worker-001',
    tenantId,
    name: 'GDS-Worker-London-01',
    host: 'worker-london-01.travel-ops.com',
    pid: 12345,
    version: '2.1.4',
    status: 'busy',
    lastHeartbeat: minutesAgo(0.5), // 30 seconds ago
    startedAt: minutesAgo(480), // Started 8 hours ago
    currentJobId: 'job-003',
    currentJobType: 'gds_queue_check',
    currentJobStarted: minutesAgo(3),
    jobsCompleted: 47,
    jobsFailed: 2,
    averageJobTime: 85000, // 1 minute 25 seconds
    capabilities: ['amadeus', 'sabre', 'gds_processing', 'utr_processing'],
    maxConcurrentJobs: 3,
    createdAt: minutesAgo(2880), // Started 2 days ago
    updatedAt: minutesAgo(0.5)
  },
  {
    id: 'worker-002',
    tenantId,
    name: 'Virtual-Worker-London-02',
    host: 'worker-london-02.travel-ops.com',
    pid: 12346,
    version: '2.1.4',
    status: 'idle',
    lastHeartbeat: minutesAgo(0.25), // 15 seconds ago
    startedAt: minutesAgo(360), // Started 6 hours ago
    currentJobId: null,
    currentJobType: null,
    currentJobStarted: null,
    jobsCompleted: 23,
    jobsFailed: 1,
    averageJobTime: 120000, // 2 minutes
    capabilities: ['virtual_processing', 'payment_recovery', 'notifications'],
    maxConcurrentJobs: 5,
    createdAt: minutesAgo(2880),
    updatedAt: minutesAgo(0.25)
  },
  {
    id: 'worker-003',
    tenantId,
    name: 'Reports-Worker-01',
    host: 'worker-reports-01.travel-ops.com',
    pid: 12347,
    version: '2.1.3',
    status: 'idle',
    lastHeartbeat: minutesAgo(1), // 1 minute ago
    startedAt: minutesAgo(1440), // Started 24 hours ago
    currentJobId: null,
    currentJobType: null,
    currentJobStarted: null,
    jobsCompleted: 8,
    jobsFailed: 0,
    averageJobTime: 1800000, // 30 minutes
    capabilities: ['reporting', 'data_analysis', 'long_running_tasks'],
    maxConcurrentJobs: 1,
    createdAt: minutesAgo(10080), // Created 1 week ago
    updatedAt: minutesAgo(1)
  },
  {
    id: 'worker-004',
    tenantId,
    name: 'GDS-Worker-Manchester-01',
    host: 'worker-manchester-01.travel-ops.com',
    pid: null,
    version: '2.1.4',
    status: 'offline',
    lastHeartbeat: minutesAgo(15), // 15 minutes ago - offline
    startedAt: minutesAgo(120), // Started 2 hours ago but went offline
    currentJobId: null,
    currentJobType: null,
    currentJobStarted: null,
    jobsCompleted: 5,
    jobsFailed: 3,
    averageJobTime: 95000,
    capabilities: ['amadeus', 'sabre', 'gds_processing'],
    maxConcurrentJobs: 2,
    createdAt: minutesAgo(1440),
    updatedAt: minutesAgo(15)
  }
];

// ============================================================================
// EXPORT ALL SEED DATA
// ============================================================================

export const QUEUE_SEED_DATA = {
  queueConfigs: QUEUE_CONFIGS_SEED_DATA,
  queueMessages: QUEUE_MESSAGES_SEED_DATA,
  queueWorkers: QUEUE_WORKERS_SEED_DATA
};

