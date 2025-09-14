/**
 * Node Feature Factory
 * 
 * Factory for creating standardized, optimized node feature clients.
 */

import React, { ReactNode, useState, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { BaseFeatureFactory, FeatureRegistry, PerformanceTracker } from '@/lib/pages/core';
import { 
  NodeFeatureConfig,
  NodeFeatureProps,
} from '@/lib/pages/types/node';
import { FeatureType } from '@/lib/pages/types/common';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Simple tab state hook implementation
const useNodeTabState = () => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [visitedTabs, setVisitedTabs] = useState<string[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string>('');

  const markTabVisited = (tabId: string) => {
    setVisitedTabs(prev => prev.includes(tabId) ? prev : [...prev, tabId]);
  };

  return {
    activeTab,
    visitedTabs,
    setActiveTab,
    markTabVisited,
    setCurrentNodeId,
    currentNodeId
  };
};

/**
 * Node Feature Factory
 * 
 * Factory for creating standardized, high-performance node feature clients with:
 * - Tab-based navigation
 * - Pre-rendered content for instant tab switching
 * - Data pre-caching and sharing
 * - Performance tracking
 */
export class NodeFeatureFactory extends BaseFeatureFactory {
  /**
   * Create a node feature client component
   * 
   * @param config Node feature configuration
   * @returns React component for the node feature client
   */
  static createClient<T extends NodeFeatureProps>(
    config: NodeFeatureConfig
  ): React.FC<T> {
    // Add feature type if not set
    const fullConfig: NodeFeatureConfig = {
      ...config,
      featureType: FeatureType.NODE
    };
    
    // Register this feature with the registry
    this.registerFeature(fullConfig);
    
    // Create and return the client component
    return function NodeFeatureClient(props: T) {
      const queryClient = useQueryClient();
      const pathname = usePathname();
      
      // Use tab state
      const { 
        activeTab: globalActiveTab, 
        visitedTabs: globalVisitedTabs,
        setActiveTab: setGlobalActiveTab,
        markTabVisited,
        setCurrentNodeId
      } = useNodeTabState();
      
      // Performance tracking
      const perfRef = useRef({
        lastTabSwitchStart: 0,
        tabSwitchCount: 0
      });
      
      // Track tab switch times
      const tabSwitchTimes = useRef<Record<string, number>>({});
      
      // Get initial tab from URL or default to first tab or global state
      const initialTab = useMemo(() => {
        if (typeof window === 'undefined') return fullConfig.tabs[0].id;
        
        // Try URL param first
        const url = new URL(window.location.href);
        const tabFromUrl = url.searchParams.get('tab');
        if (tabFromUrl && fullConfig.tabs.some(tab => tab.id === tabFromUrl)) {
          return tabFromUrl;
        }
        
        // Then try global state if we have a matching tab
        if (globalActiveTab && fullConfig.tabs.some(tab => tab.id === globalActiveTab)) {
          return globalActiveTab;
        }
        
        // Default to first tab
        return fullConfig.tabs[0].id;
      }, [fullConfig.tabs, globalActiveTab]);
      
      // Setup local state that syncs with global state
      const [activeTab, setActiveTab] = useState(initialTab);
      
      // Save node ID to global state when component mounts
      useEffect(() => {
        if (props.nodeId) {
          setCurrentNodeId(props.nodeId);
        }
      }, [props.nodeId, setCurrentNodeId]);
      
      // Sync local state with global state
      useEffect(() => {
        if (activeTab !== globalActiveTab && 
            fullConfig.tabs.some(tab => tab.id === activeTab)) {
          setGlobalActiveTab(activeTab);
        }
      }, [activeTab, globalActiveTab, setGlobalActiveTab, fullConfig.tabs]);

      // Track visited tabs
      const visitedTabs = useMemo(() => {
        // Start with global visited tabs
        const tabs = new Set(globalVisitedTabs);
        // Always include the initial tab
        tabs.add(initialTab);
        return tabs;
      }, [globalVisitedTabs, initialTab]);
      
      // Pre-populate React Query cache with all data on first load
      useEffect(() => {
        if (!queryClient || !props.nodeId || !props.tenantId) return;
        
        const perfId = PerformanceTracker.startTracking('feature-load', undefined, {
          featureKey: fullConfig.featureKey,
          nodeId: props.nodeId,
          phase: 'cache-init'
        });
        
        // Get query keys for this feature
        const queryKeys = fullConfig.getQueryKeys 
          ? fullConfig.getQueryKeys(props.nodeId, props.tenantId)
          : {};
        
        // Pre-cache all initial data
        const cacheData = async () => {
          // Cache each data type
          await Promise.all(
            Object.entries(queryKeys).map(([key, queryKey]) => {
              // Only cache if we have initial data for this key
              if (props[key as keyof T]) {
                return queryClient.setQueryData(
                  queryKey,
                  props[key as keyof T]
                );
              }
              return Promise.resolve();
            })
          );
        };
        
        cacheData().then(() => {
          PerformanceTracker.endTracking(perfId);
        });
      }, [queryClient, props.nodeId, props.tenantId]);
      
      // Update URL when tab changes (without page reload)
      useEffect(() => {
        if (typeof window === 'undefined') return;
        
        // Measure and log tab switch performance
        const now = performance.now();
        if (perfRef.current.lastTabSwitchStart > 0) {
          const switchTime = now - perfRef.current.lastTabSwitchStart;
          perfRef.current.tabSwitchCount++;
          
          // Store switch time for this tab
          tabSwitchTimes.current[activeTab] = switchTime;
          
          if (process.env.NODE_ENV !== 'production') {
            // Tab switch performance measurement
          }
        }
      }, [activeTab]);
      
      // Handle tab change with optimistic UI update
      const handleTabChange = (tabId: string) => {
        // Start measuring tab switch time
        perfRef.current.lastTabSwitchStart = performance.now();
        
        // Track this tab as visited
        markTabVisited(tabId);
        
        // Update state immediately for instant UI response
        setActiveTab(tabId);
      };
      
      // Pre-fetch data for tabs on hover
      const handleTabHover = (tabId: string) => {
        // Skip if already active or visited
        if (tabId === activeTab || visitedTabs.has(tabId)) return;
        
        // Use custom prefetch logic if provided
        if (fullConfig.prefetchTabData) {
          fullConfig.prefetchTabData(tabId, props.nodeId, props.tenantId, queryClient);
        }
      };
      
      // Default tab renderer implementation
      const defaultTabRenderer = (
        activeTab: string,
        handleTabChange: (tabId: string) => void,
        handleTabHover: (tabId: string) => void,
        tabs: typeof fullConfig.tabs
      ) => (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="flex border-b-0">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="px-6 py-3 text-sm font-medium"
                activeColor="red"
                activeTabWeight={2}
                underlineStyle="exact"
                onMouseEnter={() => handleTabHover(tab.id)}
                onFocus={() => handleTabHover(tab.id)}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      );
      
      return (
        <div className="space-y-6">
          <div className="border-b bg-white">
            <div className="container mx-auto max-w-6xl">
              {/* Render tabs */}
              {fullConfig.renderTabs 
                ? fullConfig.renderTabs(activeTab, handleTabChange, handleTabHover, fullConfig.tabs)
                : defaultTabRenderer(activeTab, handleTabChange, handleTabHover, fullConfig.tabs)
              }
              
              {/* Pre-render all tabs but show only the active one */}
              <div className="tab-content-container">
                {fullConfig.tabs.map(tab => {
                  const Component = fullConfig.components[tab.id];
                  return Component ? (
                    <div 
                      key={tab.id}
                      className={`tab-content ${activeTab === tab.id ? 'block' : 'hidden'}`}
                      aria-hidden={activeTab !== tab.id}
                    >
                      {/* Only render component if tab is active or has been visited before */}
                      {activeTab === tab.id || visitedTabs.has(tab.id) ? (
                        <Component 
                          {...props}
                        />
                      ) : (
                        <div className="min-h-[50vh]" /> // Placeholder to maintain layout
                      )}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>
      );
    };
  }
}