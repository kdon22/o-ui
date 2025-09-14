/**
 * Settings Feature Factory
 * 
 * Factory for creating standardized, optimized settings feature clients.
 */

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BaseFeatureFactory, PerformanceTracker } from '../core';
import { 
  SettingsFeatureConfig,
  SettingsFeatureProps,
  FeatureType
} from '../types';

/**
 * Settings Feature Factory
 * 
 * Factory for creating standardized, high-performance settings feature clients with:
 * - Section-based organization
 * - Performance optimization
 * - Access control
 */
export class SettingsFeatureFactory extends BaseFeatureFactory {
  /**
   * Create a settings feature client component
   * 
   * @param config Settings feature configuration
   * @returns React component for the settings feature client
   */
  static createClient<T extends SettingsFeatureProps>(
    config: SettingsFeatureConfig
  ): React.FC<T> {
    // Add feature type if not set
    const fullConfig: SettingsFeatureConfig = {
      ...config,
      featureType: FeatureType.SETTINGS
    };
    
    // Register this feature with the registry
    this.registerFeature(fullConfig);
    
    // Create and return the client component
    return function SettingsFeatureClient(props: T) {
      const queryClient = useQueryClient();
      const MainComponent = fullConfig.component;
      
      // Check if user has access to this feature
      const hasAccess = useMemo(() => {
        if (!fullConfig.authorizeAccess) return true;
        
        return fullConfig.authorizeAccess(
          props.userId,
          props.tenantId,
          props.permissions || []
        );
      }, [props.userId, props.tenantId, props.permissions]);
      
      // Load initial data
      useEffect(() => {
        if (!queryClient || !props.userId || !props.tenantId) return;
        
        const perfId = PerformanceTracker.startTracking('feature-load', undefined, {
          featureKey: fullConfig.featureKey,
          userId: props.userId,
          phase: 'cache-init'
        });
        
        // Load initial data if loader is provided
        if (fullConfig.initialDataLoader) {
          fullConfig.initialDataLoader(props.userId, props.tenantId)
            .then(data => {
              // Store in props or context as needed
              PerformanceTracker.endTracking(perfId);
            })
            .catch(error => {
              console.error(`[SettingsFeature] Error loading initial data:`, error);
              PerformanceTracker.endTracking(perfId);
            });
        } else {
          PerformanceTracker.endTracking(perfId);
        }
      }, [queryClient, props.userId, props.tenantId]);
      
      // If user doesn't have access, show access denied
      if (!hasAccess) {
        return (
          <div className="space-y-6">
            <div className="container mx-auto max-w-3xl py-12">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="text-red-700">
                    <h3 className="text-sm font-medium">Access Denied</h3>
                    <div className="mt-2 text-sm">
                      <p>You do not have permission to access this settings section.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      // Render the main component
      return (
        <div className="space-y-6">
          <div className="container mx-auto max-w-3xl py-6">
            <div className="grid gap-6">
              <div className="flex flex-col space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">{fullConfig.section.title}</h1>
                {fullConfig.section.description && (
                  <p className="text-muted-foreground">{fullConfig.section.description}</p>
                )}
              </div>
              
              <div className="settings-content">
                <MainComponent 
                  userId={props.userId} 
                  tenantId={props.tenantId}
                  {...props}
                />
              </div>
            </div>
          </div>
        </div>
      );
    };
  }
} 