/**
 * Feature Registry
 * 
 * Central registry for all features, both node and settings.
 * Tracks feature configurations and enables discoverability.
 */

import { BaseFeatureConfig, FeatureType } from '../types';

/**
 * Type for the registry storage
 */
type RegistryStorage = {
  [FeatureType.NODE]: Map<string, BaseFeatureConfig>;
  [FeatureType.SETTINGS]: Map<string, BaseFeatureConfig>;
};

/**
 * FeatureRegistry
 * 
 * Central registry for all features, enabling:
 * - Feature registration
 * - Feature discovery
 * - Feature lookup by type and key
 */
export class FeatureRegistry {
  // Storage for registered features by type
  private static registry: RegistryStorage = {
    [FeatureType.NODE]: new Map(),
    [FeatureType.SETTINGS]: new Map()
  };
  
  /**
   * Register a feature with the registry
   * 
   * @param config Feature configuration
   */
  static registerFeature(config: BaseFeatureConfig): void {
    const { featureKey, featureType } = config;
    
    if (this.registry[featureType].has(featureKey)) {
      
    }
    
    this.registry[featureType].set(featureKey, config);
  }
  
  /**
   * Get a feature by type and key
   * 
   * @param type Feature type
   * @param key Feature key
   * @returns Feature configuration or undefined
   */
  static getFeature(type: FeatureType, key: string): BaseFeatureConfig | undefined {
    return this.registry[type].get(key);
  }
  
  /**
   * Get all features of a specific type
   * 
   * @param type Feature type
   * @returns Map of features
   */
  static getFeaturesByType(type: FeatureType): Map<string, BaseFeatureConfig> {
    return this.registry[type];
  }
  
  /**
   * Get all node features
   * 
   * @returns Map of node features
   */
  static getNodeFeatures(): Map<string, BaseFeatureConfig> {
    return this.registry[FeatureType.NODE];
  }
  
  /**
   * Get all settings features
   * 
   * @returns Map of settings features
   */
  static getSettingsFeatures(): Map<string, BaseFeatureConfig> {
    return this.registry[FeatureType.SETTINGS];
  }
  
  /**
   * Check if a feature exists
   * 
   * @param type Feature type
   * @param key Feature key
   * @returns Whether the feature exists
   */
  static hasFeature(type: FeatureType, key: string): boolean {
    return this.registry[type].has(key);
  }
  
  /**
   * Get all registered feature keys of a specific type
   * 
   * @param type Feature type
   * @returns Array of feature keys
   */
  static getFeatureKeys(type: FeatureType): string[] {
    return Array.from(this.registry[type].keys());
  }
  
  /**
   * Clear all features (mainly for testing)
   * 
   * @param type Optional type to clear
   */
  static clearFeatures(type?: FeatureType): void {
    if (type) {
      this.registry[type].clear();
    } else {
      this.registry[FeatureType.NODE].clear();
      this.registry[FeatureType.SETTINGS].clear();
    }
  }
}