/**
 * Settings Feature Types
 * 
 * Type definitions specific to settings features.
 */

import { ReactNode } from 'react';
import { BaseFeatureConfig, BaseFeatureProps } from './common';

/**
 * Settings feature client props
 */
export interface SettingsFeatureProps extends BaseFeatureProps {
  userId: string;
  settings?: Record<string, any>;
  permissions?: string[];
  [key: string]: any; // Allow additional data
}

/**
 * Settings section definition
 */
export interface SettingsSection {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  priority?: number; // For ordering sections
}

/**
 * Navigation item for settings
 */
export interface SettingsNavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: ReactNode;
  parent?: string; // For nested navigation
  permissions?: string[]; // Required permissions to see this item
}

/**
 * Component map for settings features
 */
export type SettingsComponentMap = Record<string, React.ComponentType<any>>;

/**
 * Settings feature configuration
 */
export interface SettingsFeatureConfig extends BaseFeatureConfig {
  // Section configuration
  section: SettingsSection;
  
  // Navigation items
  navigationItems: SettingsNavigationItem[];
  
  // Main component for the feature
  component: React.ComponentType<any>;
  
  // Optional sub-components
  components?: SettingsComponentMap;
  
  // Data management
  initialDataLoader?: (userId: string, tenantId: string) => Promise<any>;
  
  // Whether this feature requires admin permissions
  requiresAdmin?: boolean;
  
  // Authorization check function
  authorizeAccess?: (userId: string, tenantId: string, permissions: string[]) => boolean;
} 