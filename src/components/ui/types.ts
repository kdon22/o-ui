import type { LucideIcon } from 'lucide-react';
import React from 'react';

// Base type for common properties
interface BaseMenuItem {
  icon?: LucideIcon | React.ReactElement;
  disabled?: boolean;
  className?: string;
  shouldShow?: (context?: any) => boolean;
}

// Type for a regular action item
interface ActionMenuItem extends BaseMenuItem {
  id: string; // Required for actions
  label: string; // Required for actions
  isSeparator?: false; // Explicitly not a separator
}

// Type for a separator item
interface SeparatorMenuItem extends BaseMenuItem {
  isSeparator: true; // Required for separators
  id?: never; // Should not have id
  label?: never; // Should not have label
}

// Union type for all possible menu items
export type MenuItemDef = ActionMenuItem | SeparatorMenuItem; 