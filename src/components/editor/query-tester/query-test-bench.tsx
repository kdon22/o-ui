/**
 * Query Test Bench - Professional Three-Panel Interface
 * 
 * Features:
 * - Tree view with categorized tables (left panel)
 * - Query builder with syntax highlighting (middle panel) 
 * - Live results with instant feedback (right panel)
 * - Professional IDE-style layout
 */

'use client';

import React from 'react';
import { ThreePanelQueryInterface } from './components/three-panel-query-interface';
import { IntegratedQueryInterface } from './components/integrated-query-interface';

export interface QueryTestBenchProps {
  onQueryGenerated?: (query: string) => void;
  layout?: 'three-panel' | 'integrated';
  className?: string;
}

export function QueryTestBench({ 
  onQueryGenerated, 
  layout = 'three-panel',
  className
}: QueryTestBenchProps) {
  if (layout === 'integrated') {
    return (
      <IntegratedQueryInterface
        onQueryGenerated={onQueryGenerated}
        className={className}
      />
    );
  }

  return (
    <ThreePanelQueryInterface
      onQueryGenerated={onQueryGenerated}
      className={className}
    />
  );
}