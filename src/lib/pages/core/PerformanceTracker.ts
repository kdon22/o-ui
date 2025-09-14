/**
 * Performance Tracker
 * 
 * Utilities for measuring and tracking performance of features.
 */

/**
 * Type for performance metrics
 */
export interface PerformanceEntry {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, string>;
}

/**
 * Available metric types
 */
export type MetricType = 
  | 'feature-load'
  | 'tab-switch'
  | 'data-fetch'
  | 'render'
  | 'interaction'
  | 'custom';

/**
 * Performance Tracker - Monitors performance of features
 */
export class PerformanceTracker {
  // Store performance entries
  private static entries: PerformanceEntry[] = [];
  
  // Active measurements
  private static activeMeasurements = new Map<string, PerformanceEntry>();
  
  // Metric thresholds for warning (in ms)
  private static thresholds: Record<MetricType, number> = {
    'feature-load': 300,
    'tab-switch': 100,
    'data-fetch': 200,
    'render': 50,
    'interaction': 50,
    'custom': 500
  };
  
  /**
   * Start tracking a performance metric
   * 
   * @param metricType Type of metric being tracked
   * @param id Identifier for this measurement
   * @param tags Additional metadata about the measurement
   * @returns ID of the measurement
   */
  static startTracking(
    metricType: MetricType,
    id: string = crypto.randomUUID(),
    tags: Record<string, string> = {}
  ): string {
    const entry: PerformanceEntry = {
      id,
      startTime: performance.now(),
      tags: {
        type: metricType,
        ...tags
      }
    };
    
    this.activeMeasurements.set(id, entry);
    return id;
  }
  
  /**
   * End tracking a performance metric
   * 
   * @param id ID of the measurement to end
   * @returns Performance entry with duration or undefined if not found
   */
  static endTracking(id: string): PerformanceEntry | undefined {
    const entry = this.activeMeasurements.get(id);
    
    if (!entry) {
      console.warn(`[PerformanceTracker] No active measurement found with ID: ${id}`);
      return undefined;
    }
    
    // Calculate duration
    entry.endTime = performance.now();
    entry.duration = entry.endTime - entry.startTime;
    
    // Check against thresholds
    const metricType = entry.tags.type as MetricType;
    const threshold = this.thresholds[metricType] || this.thresholds.custom;
    
    if (entry.duration > threshold) {
      console.warn(
        `[PerformanceTracker] ${metricType} took ${entry.duration.toFixed(2)}ms, ` +
        `which exceeds the threshold of ${threshold}ms`,
        entry
      );
    }
    
    // Store the completed entry
    this.entries.push(entry);
    
    // Remove from active measurements
    this.activeMeasurements.delete(id);
    
    return entry;
  }
  
  /**
   * Get all completed measurements
   * 
   * @returns Array of completed performance entries
   */
  static getEntries(): PerformanceEntry[] {
    return [...this.entries];
  }
  
  /**
   * Get entries of a specific type
   * 
   * @param metricType Type of metrics to retrieve
   * @returns Filtered array of performance entries
   */
  static getEntriesByType(metricType: MetricType): PerformanceEntry[] {
    return this.entries.filter(entry => entry.tags.type === metricType);
  }
  
  /**
   * Clear all performance entries
   */
  static clearEntries(): void {
    this.entries = [];
  }
  
  /**
   * Update threshold for a metric type
   * 
   * @param metricType Type of metric to update
   * @param threshold New threshold in milliseconds
   */
  static setThreshold(metricType: MetricType, threshold: number): void {
    this.thresholds[metricType] = threshold;
  }
  
  /**
   * Track an operation and return its result
   * 
   * @param metricType Type of operation being tracked
   * @param operation Function to track
   * @param tags Additional metadata
   * @returns Result of the operation
   */
  static async trackOperation<T>(
    metricType: MetricType,
    operation: () => Promise<T> | T,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const id = this.startTracking(metricType, undefined, tags);
    
    try {
      const result = await operation();
      return result;
    } finally {
      this.endTracking(id);
    }
  }
} 