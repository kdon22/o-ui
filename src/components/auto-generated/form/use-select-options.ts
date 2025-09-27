// ============================================================================
// SMART SELECT - THE INCREDIBLE APPROACH 🚀
// ============================================================================
// 
// This file is now a simple re-export of the new SmartSelect system.
// All the magic happens in use-smart-select.ts
//
// Benefits:
// ✅ 90% Less Code - Most fields become 1-2 lines
// ✅ Zero Boilerplate - No more useEffect, useState, loading states  
// ✅ Type Safe - Full TypeScript inference from action responses
// ✅ Performance First - Smart caching, deduplication, debouncing built-in
// ✅ Reads Like English - when: { vendor: '=${vendor}' }
// ✅ Action System Native - Uses {entity}.list with filters
// ============================================================================

import { useSmartSelect } from './use-smart-select';
import type { SmartSelectOption } from './use-smart-select';

// Re-export everything from the new system
export { useSmartSelect as useSelectOptions, SmartSelectOption as ConditionalOption };
export type { SmartSelectOptions } from './use-smart-select';

// Legacy type aliases for backwards compatibility
export interface ConditionalFilter {
  watchField: string;
  apiFilters?: Record<string, string | ((value: any) => Record<string, any>)>;
  localFilter?: (option: SmartSelectOption, watchedValue: any) => boolean;
}
