/**
 * Base Feature Factory
 * 
 * Abstract base factory with shared functionality for all feature types.
 */

import { BaseFeatureConfig, FeatureType } from '../types';
import { FeatureRegistry } from './FeatureRegistry';

/**
 * Base Feature Factory - Abstract base for feature factory implementations
 * 
 * Provides common functionality needed by both node and settings feature factories:
 * - Feature registration
 * - Configuration validation
 * - Type safety
 */
export abstract class BaseFeatureFactory {
  /**
   * Register a feature with the registry
   * 
   * @param config Feature configuration
   */
  protected static registerFeature(config: BaseFeatureConfig): void {
    // Validate configuration
    this.validateConfig(config);
    
    // Register with the feature registry
    FeatureRegistry.registerFeature(config);
  }
  
  /**
   * Validate a feature configuration
   * 
   * @param config Feature configuration
   * @throws Error if configuration is invalid
   */
  protected static validateConfig(config: BaseFeatureConfig): void {
    const { featureKey, featureType, displayName } = config;
    
    // Check required fields
    if (!featureKey) {
      throw new Error(`Feature configuration missing required 'featureKey'`);
    }
    
    if (!featureType) {
      throw new Error(`Feature configuration missing required 'featureType'`);
    }
    
    if (!displayName) {
      throw new Error(`Feature configuration missing required 'displayName'`);
    }
    
    // Check valid feature type
    if (!Object.values(FeatureType).includes(featureType)) {
      throw new Error(`Invalid feature type: ${featureType}`);
    }
  }
  
  /**
   * Check if a feature is registered
   * 
   * @param featureKey Feature key to check
   * @param featureType Feature type
   * @returns Whether the feature is registered
   */
  protected static isFeatureRegistered(featureKey: string, featureType: FeatureType): boolean {
    return FeatureRegistry.hasFeature(featureType, featureKey);
  }
} 