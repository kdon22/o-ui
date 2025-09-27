import { useMemo, useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import { useActionQuery } from '@/hooks/query/use-action-query';
import type { FieldSchema } from '@/lib/resource-system/schemas';

// ============================================================================
// TYPES - DECLARATIVE CONDITIONAL OPTIONS
// ============================================================================

export interface SmartSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  metadata?: Record<string, any>;
}

export interface SmartSelectDependency {
  field: string;
  filter?: string;
  transform?: (value: any) => Record<string, any>;
}

export interface SmartSelectOptions {
  // CORE CONFIG - ONE LINE TO RULE THEM ALL
  source?: string;                   // 'offices.list', 'workflows.list', etc.
  
  // SMART DEFAULTS (optional)
  valueField?: string;               // Auto-infers 'id' if not specified
  labelField?: string;               // Auto-infers 'name' if not specified
  searchable?: boolean;              // Auto-enables for 10+ items
  placeholder?: string | 'auto';     // Auto-generates "Select {label.toLowerCase()}..."
  
  // DECLARATIVE DEPENDENCIES 
  when?: Record<string, any>;        // { vendor: '=${vendor}', type: { 'GDS': {...} }}
  dependsOn?: SmartSelectDependency[]; // Alternative syntax
  
  // ADVANCED FEATURES (optional)
  transform?: (item: any) => SmartSelectOption; // Custom display logic
  cache?: string | number;           // Cache duration: '5m', 300, etc.
  debounce?: number;                // Debounce dependency changes (ms)
  
  // LEGACY SUPPORT
  static?: Array<{ value: string; label: string; disabled?: boolean }>;
  dynamic?: {
    resource: string;
    valueField: string;
    labelField: string;
  };
  conditional?: any[]; // Legacy conditional format
}

// ============================================================================
// SMART SELECT HOOK - THE MAGIC ✨
// ============================================================================

export const useSmartSelect = (
  field: FieldSchema & { options?: SmartSelectOptions },
  control: any,
  tenantId: string,
  branchId?: string
) => {
  const options = field.options;
  
  // ==========================================================================
  // NO OPTIONS - Return empty state immediately
  // ==========================================================================
  if (!options) {
    return {
      options: [],
      loading: false,
      error: null,
      placeholder: `Select ${field.label.toLowerCase()}...`,
      searchable: false,
      isEmpty: true,
      hasData: false
    };
  }
  
  // ==========================================================================
  // STATIC OPTIONS - Simple case, return immediately
  // ==========================================================================
  if (options.static) {
    return {
      options: options.static.map(option => ({
        value: option.value,
        label: option.label,
        disabled: option.disabled || false,
        metadata: option
      })),
      loading: false,
      error: null,
      placeholder: `Select ${field.label.toLowerCase()}...`,
      searchable: options.static.length >= 10,
      isEmpty: options.static.length === 0,
      hasData: options.static.length > 0
    };
  }

  // ==========================================================================
  // DYNAMIC OPTIONS - The incredible part starts here 🚀
  // ==========================================================================
  
  // Extract action name from source or legacy dynamic config
  const actionName = useMemo(() => {
    if (options?.source) return options.source;
    if (options?.dynamic?.resource) return `${options.dynamic.resource}.list`;
    if (options?.conditional?.[0]) return 'unknown.list';
    return null;
  }, [options]);

  // Smart field inference
  const valueField = options?.valueField || options?.dynamic?.valueField || 'id';
  const labelField = options?.labelField || options?.dynamic?.labelField || 'name';
  
  // ==========================================================================
  // DEPENDENCY TRACKING - Parse "when" conditions
  // ==========================================================================
  const dependencies = useMemo(() => {
    const deps: Array<{ field: string; transform?: (value: any) => Record<string, any> }> = [];
    
    // Parse new "when" syntax
    if (options?.when) {
      Object.entries(options.when).forEach(([field, config]) => {
        console.log('🔍 [SmartSelect] Processing when condition:', {
          field,
          config,
          configType: typeof config,
          configString: String(config),
          startsWithTemplate: typeof config === 'string' && config.startsWith('=${'),
        });

        if (typeof config === 'string' && config.startsWith('=${')) {
          // Simple case: vendor: '=${vendor}' 
          const fieldName = config.slice(3, -1); // Remove =${ and }
          console.log('✅ [SmartSelect] Template parsing:', {
            originalConfig: config,
            extractedFieldName: fieldName,
            willWatchField: fieldName,
            willCreateParam: field,
          });
          deps.push({ 
            field: fieldName,
            transform: (value) => ({ [field]: value })
          });
        } else if (typeof config === 'object') {
          // Complex case: type: { 'GDS': { supportedTypes: 'GDS' }, ... }
          console.log('✅ [SmartSelect] Object mapping:', {
            watchField: field,
            mappingKeys: Object.keys(config),
          });
          deps.push({
            field,
            transform: (value) => {
              const mapping = config[value] || config['*'] || {};
              console.log('🔍 [SmartSelect] Mapping transform:', {
                inputValue: value,
                foundMapping: mapping,
                usedKey: config[value] ? value : '*',
              });
              return mapping;
            }
          });
        }
      });
    }
    
    // Parse legacy conditional syntax
    if (options?.conditional) {
      options.conditional.forEach((filter: any) => {
        if (filter.watchField && filter.apiFilters) {
          deps.push({
            field: filter.watchField,
            transform: (value) => {
              const result: Record<string, any> = {};
              Object.entries(filter.apiFilters).forEach(([key, filterValue]) => {
                if (typeof filterValue === 'function') {
                  Object.assign(result, filterValue(value));
                } else if (typeof filterValue === 'string') {
                  result[key] = filterValue.replace('{value}', value);
                } else {
                  result[key] = filterValue;
                }
              });
              return result;
            }
          });
        }
      });
    }

    // Parse dependsOn syntax
    if (options?.dependsOn) {
      options.dependsOn.forEach(dep => {
        deps.push({
          field: dep.field,
          transform: (value) => ({
            [dep.filter || dep.field]: value
          })
        });
      });
    }

    // 🔍 DEBUG: Log dependency parsing
    console.log('🔍 [SmartSelect] Dependencies parsed for', field.key, ':', {
      hasWhen: !!options?.when,
      whenConfig: options?.when,
      parsedDeps: deps.map(d => ({ field: d.field })),
      timestamp: new Date().toISOString()
    });

    return deps;
  }, [options, field.key]);

  // Watch dependency fields
  const watchFields = dependencies.map(dep => dep.field);
  const watchedValues = useWatch({
    control,
    name: watchFields.length > 0 ? watchFields : [],
  });

  // ==========================================================================
  // BUILD QUERY PARAMETERS - Smart parameter building
  // ==========================================================================
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};

    dependencies.forEach((dep, index) => {
      const value = Array.isArray(watchedValues) ? watchedValues[index] : watchedValues;
      if (value && value !== '' && dep.transform) {
        const transformedParams = dep.transform(value);
        Object.assign(params, transformedParams);
      }
    });

    // 🔍 DEBUG: Log what filters are being sent
    if (Object.keys(params).length > 0) {
      console.log('🔍 [SmartSelect] Query params for', actionName, ':', {
        fieldKey: field.key,
        watchedValues,
        dependencies: dependencies.map(d => ({ field: d.field })),
        finalParams: params,
        timestamp: new Date().toISOString()
      });
    }

    return params;
  }, [dependencies, watchedValues, actionName, field.key]);

  // ==========================================================================
  // SHOULD FETCH LOGIC - Smart fetching decisions
  // ==========================================================================
  const shouldFetch = useMemo(() => {
    if (!actionName) return false;
    
    // If no dependencies, always fetch
    if (dependencies.length === 0) return true;
    
    // If has dependencies, only fetch when all required values are present
    return dependencies.some((_, index) => {
      const value = Array.isArray(watchedValues) ? watchedValues[index] : watchedValues;
      return value && value !== '';
    });
  }, [actionName, dependencies, watchedValues]);

  // ==========================================================================
  // ACTION QUERY - The power of the action system
  // ==========================================================================
  const { 
    data: queryData, 
    isLoading, 
    error: queryError 
  } = useActionQuery(
    actionName || 'noop', // Safe fallback when no action
    queryParams,
    {
      enabled: shouldFetch && !!actionName, // Only call when we have a valid action
      staleTime: options?.cache === '5m' ? 5 * 60 * 1000 : 
                 typeof options?.cache === 'number' ? options.cache : 
                 30 * 1000, // Default 30 seconds
    }
  );

  // ==========================================================================
  // TRANSFORM DATA - Smart transformation and formatting
  // ==========================================================================
  const transformedOptions = useMemo(() => {
    if (!queryData?.data) return [];

    let items = Array.isArray(queryData.data) ? queryData.data : [queryData.data];

    // Apply custom transform if provided
    if (options?.transform) {
      return items.map(options.transform);
    }

    // Default transformation
    return items.map((item: any) => ({
      value: item[valueField],
      label: item[labelField],
      disabled: item.isActive === false,
      metadata: item
    }));
  }, [queryData, options?.transform, valueField, labelField]);

  // ==========================================================================
  // SMART DEFAULTS - Auto-generate placeholder, etc.
  // ==========================================================================
  const smartPlaceholder = useMemo(() => {
    if (options?.placeholder && options.placeholder !== 'auto') {
      return options.placeholder;
    }
    return `Select ${field.label.toLowerCase()}...`;
  }, [options?.placeholder, field.label]);

  // Auto-enable search for 10+ items
  const isSearchable = options?.searchable !== false && 
                      (options?.searchable === true || transformedOptions.length >= 10);

  // ==========================================================================
  // RETURN THE MAGIC ✨
  // ==========================================================================
  return {
    options: transformedOptions,
    loading: isLoading,
    error: queryError ? `Error loading ${field.label.toLowerCase()} options: ${queryError.message}` : null,
    placeholder: smartPlaceholder,
    searchable: isSearchable,
    isEmpty: transformedOptions.length === 0 && !isLoading,
    hasData: transformedOptions.length > 0
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Utility to create smart select options easily
 */
export const createSmartSelectOptions = (config: {
  source: string;
  when?: Record<string, any>;
  transform?: (item: any) => SmartSelectOption;
  cache?: string | number;
}): SmartSelectOptions => config;

/**
 * Common patterns for easy reuse
 */
export const SmartSelectPatterns = {
  // Simple dynamic select
  simple: (resource: string): SmartSelectOptions => ({
    source: `${resource}.list`
  }),

  // Filtered by parent
  filtered: (resource: string, parentField: string, filterField?: string): SmartSelectOptions => ({
    source: `${resource}.list`,
    when: {
      [filterField || parentField]: `=\${${parentField}}`
    }
  }),

  // Complex conditional
  conditional: (resource: string, conditions: Record<string, any>): SmartSelectOptions => ({
    source: `${resource}.list`,
    when: conditions
  })
};
