/**
 * AutoDataTable - Clean Airtable-like Interface (Refactored)
 * 
 * Simplified main component that orchestrates focused sub-components
 * Reduced from 1049 lines to <50 lines for better maintainability
 */

"use client";

import React from 'react';

// Components
import { TableContainer } from './components';

// Types
import { AutoDataTableProps } from './types';

/**
 * Main AutoDataTable component - now just a thin wrapper around TableContainer
 * All the heavy lifting has been moved to focused, reusable components
 */
export const AutoDataTable: React.FC<AutoDataTableProps> = (props) => {
  return <TableContainer {...props} />;
};
