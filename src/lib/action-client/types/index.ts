// ============================================================================
// CORE ACTION CLIENT TYPES - Complete Type System
// ============================================================================

export interface ActionRequest {
  action: string;
  data?: any;
  options?: RequestOptions;
  branchContext?: BranchContext | null;
}

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  junctions?: Record<string, any[]>;
  error?: string;
  cached?: boolean;
  queued?: boolean;
  optimistic?: boolean;
  fallback?: boolean;
  executionTime?: number;
  timestamp?: number;
  action?: string;
  meta?: ActionMeta;
}

export interface ActionMeta {
  operation?: 'create' | 'update' | 'delete' | 'read';
  copyOnWrite?: boolean;
  originalId?: string;
  branchId?: string;
  source?: 'cache' | 'indexeddb' | 'api';
  performance?: PerformanceMetrics;
}

export interface RequestOptions {
  serverOnly?: boolean;
  timeout?: number;
  retries?: number;
  include?: string[];
  filters?: Record<string, any>;
  sort?: SortConfig;
  pagination?: PaginationConfig;
  priority?: 'low' | 'normal' | 'high';
}

export interface BranchContext {
  currentBranchId: string;
  defaultBranchId: string;
  tenantId: string;
  userId: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  limit: number;
}

// ============================================================================
// CLIENT CONFIGURATION
// ============================================================================

export interface ActionClientConfig {
  mode: ClientMode;
  tenantId: string;
  performance: PerformanceConfig;
  cache: CacheConfig;
  retry: RetryConfig;
  indexedDB: IndexedDBConfig;
  debug: DebugConfig;
  features: FeatureConfig;
}

export type ClientMode = 'hybrid' | 'indexeddb-first' | 'server-only';

export interface PerformanceConfig {
  requestTimeout: number;
  cacheSize: number;
  maxConcurrentRequests: number;
  enableCompression: boolean;
  enableDeduplication: boolean;
  enablePrefetching: boolean;
}

export interface CacheConfig {
  ttl: number;
  maxMemoryMB: number;
  strategy: 'LRU' | 'LFU' | 'FIFO';
  crossTabSync: boolean;
  persistToDisk: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface IndexedDBConfig {
  dbName: string;
  version: number;
  useCompoundKeys: boolean;
  enableMigration: boolean;
  maxStorageQuota: number;
}

export interface DebugConfig {
  enabled: boolean;
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  logPerformance: boolean;
  logCacheHits: boolean;
  logNetworkRequests: boolean;
  enableProfiling: boolean;
}

export interface FeatureConfig {
  optimisticUpdates: boolean;
  backgroundSync: boolean;
  conflictResolution: boolean;
  dataValidation: boolean;
  payloadOptimization: boolean;
}

// ============================================================================
// COMPOUND KEYS & STORAGE
// ============================================================================

export type CompoundKey = [string, string]; // [id, branchId]
export type StorageKey = CompoundKey | string;

export interface IndexedDBStore {
  name: string;
  keyPath: string;
  autoIncrement: boolean;
  indexes: IndexConfig[];
}

export interface IndexConfig {
  name: string;
  keyPath: string | string[];
  unique: boolean;
  multiEntry?: boolean;
}

// ============================================================================
// PERFORMANCE & MONITORING
// ============================================================================

export interface PerformanceMetrics {
  operationStart: number;
  cacheCheckTime?: number;
  indexedDBTime?: number;
  networkTime?: number;
  totalTime: number;
  cacheHit?: boolean;
  bytesTransferred?: number;
  requestCount?: number;
}

export interface HealthReport {
  uptime: number;
  successRate: number;
  averageLatency: number;
  cacheHitRate: number;
  errorRate: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  memoryUsage: number;
  storageUsage: number;
  lastUpdated: number;
}

export interface OperationMetrics {
  operation: string;
  count: number;
  totalTime: number;
  averageTime: number;
  successCount: number;
  errorCount: number;
  cacheHits: number;
  cacheMisses: number;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface ActionError extends Error {
  code: ErrorCode;
  operation: string;
  context: ErrorContext;
  retryable: boolean;
  solution?: string;
  originalError?: Error;
}

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR', 
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INDEXEDDB_ERROR = 'INDEXEDDB_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorContext {
  action: string;
  requestId: string;
  timestamp: number;
  tenantId?: string;
  branchId?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  payload?: any;
  stackTrace?: string;
}

// ============================================================================
// SYNC & QUEUE
// ============================================================================

export interface SyncQueueItem {
  id: string;
  action: string;
  data: any;
  options?: RequestOptions;
  branchContext?: BranchContext;
  timestamp: number;
  retryCount: number;
  priority: number;
  status: SyncStatus;
}

export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface SyncResult {
  item: SyncQueueItem;
  success: boolean;
  response?: ActionResponse;
  error?: ActionError;
  duration: number;
}

// ============================================================================
// CACHE ENTRIES
// ============================================================================

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
  compressed?: boolean;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  lastCleanup: number;
}

// ============================================================================
// ACTION MAPPINGS & REGISTRY
// ============================================================================

export interface ActionMapping {
  action: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  store: string;
  optimistic: boolean;
  cacheable: boolean;
  retryable: boolean;
  timeout?: number;
  requiresAuth: boolean;
  rateLimit?: RateLimitConfig;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipOnError: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface AsyncOperationResult<T> {
  success: boolean;
  data?: T;
  error?: ActionError;
  cancelled?: boolean;
}

export interface BatchOperation<T> {
  operations: T[];
  concurrency: number;
  continueOnError: boolean;
}

export interface BatchResult<T> {
  results: AsyncOperationResult<T>[];
  successCount: number;
  errorCount: number;
  totalTime: number;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface ActionClientEvent {
  type: ActionClientEventType;
  timestamp: number;
  data: any;
}

export enum ActionClientEventType {
  CLIENT_INITIALIZED = 'client_initialized',
  ACTION_STARTED = 'action_started',
  ACTION_COMPLETED = 'action_completed',
  ACTION_FAILED = 'action_failed',
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
  INDEXEDDB_OPERATION = 'indexeddb_operation',
  NETWORK_REQUEST = 'network_request',
  SYNC_STARTED = 'sync_started',
  SYNC_COMPLETED = 'sync_completed',
  ERROR_OCCURRED = 'error_occurred',
  PERFORMANCE_ALERT = 'performance_alert'
}

// ============================================================================
// EXPORTS
// ============================================================================

// All types defined in this file are exported above 