/**
 * Node Feature Types
 * 
 * Type definitions specific to node features.
 */

import { ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { BaseFeatureConfig, BaseFeatureProps, TabDefinition } from './common';

/**
 * Node feature client props
 */
export interface NodeFeatureProps extends BaseFeatureProps {
  nodeId: string;
  nodeName?: string;
  initialRules?: any[];
  process?: any[];
  workflow?: any[];
  office?: any[];
  [key: string]: any; // Allow additional data
}

/**
 * Component map for node features
 */
export type NodeComponentMap = Record<string, React.ComponentType<any>>;

/**
 * Query key map for node features
 */
export type QueryKeyMap = Record<string, readonly unknown[]>;

/**
 * Tab render function type
 */
export type TabRenderFn = (
  activeTab: string,
  handleTabChange: (tabId: string) => void,
  handleTabHover: (tabId: string) => void,
  tabs: TabDefinition[]
) => React.ReactNode;

/**
 * Prefetch data function type
 */
export type PrefetchDataFn = (
  tabId: string,
  nodeId: string,
  tenantId: string | null,
  queryClient: QueryClient
) => void;

/**
 * Get query keys function type
 */
export type GetQueryKeysFn = (
  nodeId: string,
  tenantId: string
) => QueryKeyMap;

/**
 * Node feature configuration
 */
export interface NodeFeatureConfig extends BaseFeatureConfig {
  // Tab configuration
  tabs: TabDefinition[];
  
  // Components for each tab
  components: NodeComponentMap;
  
  // Optional custom tab renderer
  renderTabs?: TabRenderFn;
  
  // Data fetching
  getQueryKeys?: GetQueryKeysFn;
  prefetchTabData?: PrefetchDataFn;
  
  // Navigation
  defaultTab?: string;
  preserveState?: boolean;
} 