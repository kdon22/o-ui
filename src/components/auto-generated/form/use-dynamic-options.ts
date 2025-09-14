import { useState, useEffect } from 'react';
import type { FieldSchema } from '@/lib/resource-system/schemas';

// ============================================================================
// TYPES
// ============================================================================
export interface DynamicOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// ============================================================================
// DYNAMIC OPTIONS HOOK
// ============================================================================
export const useDynamicOptions = (field: FieldSchema, tenantId: string, branchId?: string) => {
  const [options, setOptions] = useState<DynamicOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Always run the effect but return early if no dynamic options
    if (!field.options?.dynamic) {
      setOptions([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchOptions = async () => {
      setLoading(true);
      setError(null);

      try {
        const dynamicOptions = field.options?.dynamic;
        if (!dynamicOptions) return;
        
        const { resource, valueField, labelField, filter } = dynamicOptions;
        
        // For now, we'll mock the data until we have proper resource fetching
        // In a real implementation, this would use the action system
        const mockItems = [
          { id: '1', name: 'Option 1', isActive: true },
          { id: '2', name: 'Option 2', isActive: true },
          { id: '3', name: 'Option 3', isActive: false }
        ];

        let items = mockItems;
        
        // Apply filter if provided
        if (filter && typeof filter === 'function') {
          items = items.filter(filter);
        }

        // Transform to options format
        const transformedOptions = items.map((item: any) => ({
          value: item[valueField],
          label: item[labelField],
          disabled: item.isActive === false
        }));

        setOptions(transformedOptions);
      } catch (err) {
        setError(`Error loading ${field.options?.dynamic?.resource} options: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [field.options?.dynamic, tenantId, branchId]);

  return { options, loading, error };
}; 