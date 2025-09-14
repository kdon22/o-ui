/**
 * Tab Rendering Utilities
 * 
 * Helpers for optimizing tab rendering and transitions.
 */

import React, { ReactNode } from 'react';
import { TabDefinition } from '../types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Render standard tabs using the UI components
 * 
 * @param activeTab Currently active tab ID
 * @param handleTabChange Tab change handler
 * @param handleTabHover Tab hover handler
 * @param tabs Array of tab definitions
 * @returns JSX for tabs
 */
export function renderStandardTabs(
  activeTab: string,
  handleTabChange: (tabId: string) => void,
  handleTabHover: (tabId: string) => void,
  tabs: TabDefinition[]
): React.ReactNode {
  return (
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
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/**
 * Add performance indicators to tab rendering
 * 
 * @param activeTab Currently active tab ID
 * @param handleTabChange Tab change handler
 * @param handleTabHover Tab hover handler
 * @param tabs Array of tab definitions
 * @param isPending Whether a tab change is in progress
 * @param pendingTabId Tab that's currently loading
 * @returns JSX for tabs with loading indicators
 */
export function renderPerformanceAwareTabs(
  activeTab: string,
  handleTabChange: (tabId: string) => void,
  handleTabHover: (tabId: string) => void,
  tabs: TabDefinition[],
  isPending: boolean = false,
  pendingTabId: string | null = null
): React.ReactNode {
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="flex border-b-0">
        {tabs.map(tab => {
          const isLoading = isPending && pendingTabId === tab.id;
          
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="px-6 py-3 text-sm font-medium relative"
              activeColor="red"
              activeTabWeight={2}
              underlineStyle="exact"
              onMouseEnter={() => handleTabHover(tab.id)}
              onFocus={() => handleTabHover(tab.id)}
              data-loading={isLoading ? "true" : undefined}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
              {isLoading && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 w-full bg-red-500/70 animate-pulse"></span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

/**
 * Apply CSS transitions for tab content
 * 
 * @param tabId Tab ID
 * @param activeTab Currently active tab ID
 * @param children Tab content
 * @returns JSX for tab content with transitions
 */
export function renderTabContent(
  tabId: string,
  activeTab: string,
  children: React.ReactNode
): React.ReactNode {
  return (
    <div 
      className={`tab-content ${activeTab === tabId ? 'block' : 'hidden'}`}
      aria-hidden={activeTab !== tabId}
    >
      {children}
    </div>
  );
} 