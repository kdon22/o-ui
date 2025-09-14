/**
 * Tab Rendering Fixes
 * 
 * Contains fixed versions of tab rendering functions with correct type definitions.
 */

import React from 'react';
import { TabDefinition, TabRenderFn } from '../types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Fixed version of renderStandardTabs with explicit React.ReactNode return type
 */
export const fixedRenderStandardTabs: TabRenderFn = (
  activeTab: string,
  handleTabChange: (tabId: string) => void,
  handleTabHover: (tabId: string) => void,
  tabs: TabDefinition[]
): React.ReactNode => {
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
}; 