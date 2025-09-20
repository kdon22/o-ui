/**
 * Table Initializer - Airtable-like UX
 * 
 * Creates initial table structure with:
 * - 4 default columns (Column 1, Column 2, Column 3, Column 4)
 * - 4 empty rows
 * - Clean, simple implementation
 */

import { useActionMutation } from '@/hooks/use-action-api';

export interface TableColumn {
  name: string;
  type: 'str' | 'int' | 'bool' | 'date' | 'list';
  required?: boolean;
  options?: string[];
}

export interface TableSchema {
  columns: TableColumn[];
}

// ============================================================================
// PRIMITIVE TYPE SYSTEM (Single Source of Truth)
// ============================================================================
// We use primitive types directly throughout the system:
// - Database storage: 'str', 'int', 'bool', 'date', 'list'
// - UI components: map primitive types to appropriate input components
// - Monaco editor: uses same primitive types for schema-driven completions
// - Business rules: execute against primitive-typed data directly
// ============================================================================

/**
 * Create initial Airtable-like structure for a new table
 */
export async function createInitialTableStructure(
  tableId: string,
  actionClient: any
): Promise<void> {
  try {
    console.log('🚀 [TableInitializer] Creating initial structure for table:', tableId);

    // 1. Create default schema with 4 columns (primitive types)
    const defaultSchema: TableSchema = {
      columns: [
        { name: 'Column 1', type: 'str', required: false },
        { name: 'Column 2', type: 'str', required: false },
        { name: 'Column 3', type: 'str', required: false },
        { name: 'Column 4', type: 'str', required: false }
      ]
    };

    // 2. Update table with schema in config field
    await actionClient.execute('tables.update', {
      id: tableId,
      config: defaultSchema  // ✅ Use 'config' field, not 'schema'
    });

    console.log('✅ [TableInitializer] Schema created with 4 columns');
    console.log('🎉 [TableInitializer] Initial table structure complete!');
    console.log('ℹ️  [TableInitializer] Users can add rows manually when needed');

  } catch (error) {
    console.error('❌ [TableInitializer] Failed to create initial structure:', error);
    throw error;
  }
}

/**
 * Hook for creating initial table structure
 */
export function useTableInitializer() {
  const updateTableMutation = useActionMutation('tables.update');

  const initializeTable = async (tableId: string) => {
    // 1. Create schema with primitive types directly
    const defaultSchema: TableSchema = {
      columns: [
        { name: 'column1', type: 'str', required: false },
        { name: 'column2', type: 'str', required: false },
      ]
    };

    await updateTableMutation.mutateAsync({
      id: tableId,
      config: defaultSchema  // ✅ Use 'config' field, not 'schema'
    });

    console.log('🎉 [TableInitializer] Table initialized successfully!');
    console.log('ℹ️  [TableInitializer] Users can add rows manually when needed');
  };

  return {
    initializeTable,
    isInitializing: updateTableMutation.isPending
  };
}
