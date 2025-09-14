/**
 * Process Constants
 * 
 * Centralized constants for process management including:
 * - Enum to label mappings
 * - Form options
 * - Default values
 */

import { ProcessType } from '@prisma/client';

// ============================================================================
// PROCESS TYPE MAPPINGS - FRIENDLY NAMES
// ============================================================================
export const PROCESS_TYPE_LABELS: Record<ProcessType, string> = {
  UTR: 'UTR (Universal Travel Record)',
  SCHEDULED: 'Scheduled Tasks',
  TICKETING: 'Ticketing Operations',
  PRE_QUEUE: 'Pre-Queue Processing',
  POST_QUEUE: 'Post-Queue Processing',
  VIRTUAL_PAY: 'Virtual Payment',
  FARE_CHECK: 'Fare Validation',
  SEAT_CHECK: 'Seat Assignment Check'
};

// ============================================================================
// FORM OPTIONS
// ============================================================================
export const PROCESS_TYPE_OPTIONS = Object.entries(PROCESS_TYPE_LABELS).map(([value, label]) => ({
  value: value as ProcessType,
  label
}));

// ============================================================================
// DEFAULT VALUES
// ============================================================================
export const DEFAULT_PROCESS_VALUES = {
  isActive: true,
  version: 1
}; 