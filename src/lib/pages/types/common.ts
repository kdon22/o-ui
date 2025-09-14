/**
 * Common Types
 * 
 * Shared type definitions for the feature factory system.
 */

import { ReactNode } from 'react';

/**
 * Base properties for any feature client
 */
export interface BaseFeatureProps {
  tenantId: string;
}

/**
 * Tab definition for tab-based features
 */
export interface TabDefinition {
  id: string;
  label: string;
  icon?: ReactNode;
}

/**
 * Performance tracking data
 */
export interface PerformanceMetrics {
  loadTime?: number;
  renderTime?: number;
  interactionTime?: number;
  dataLoadTime?: number;
}

/**
 * Component rendering options
 */
export interface RenderOptions {
  showLoader?: boolean;
  loaderLabel?: string;
  errorFallback?: ReactNode;
}

/**
 * Feature type - helps with type checking
 */
export enum FeatureType {
  NODE = 'node',
  SETTINGS = 'settings'
}

/**
 * Base feature configuration shared by all feature types
 */
export interface BaseFeatureConfig {
  featureKey: string;
  featureType: FeatureType;
  displayName: string;
  description?: string;
  icon?: ReactNode;
  version?: string;
  
  // Data handling
  prefetchStrategy?: 'eager' | 'lazy' | 'hover' | 'none';
  cacheStrategy?: 'memory' | 'indexeddb' | 'none';
  cacheDuration?: number;
  
  // Custom hook to execute when the feature loads
  onLoad?: () => void;
} 