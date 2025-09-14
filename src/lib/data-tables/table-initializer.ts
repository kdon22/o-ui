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
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required?: boolean;
  options?: string[];
}

export interface TableSchema {
  columns: TableColumn[];
}

// Convert UI column types to unified primitive types for database storage
export const mapColumnTypeToPrimitive = (uiType: string): string => {
  const typeMapping: Record<string, string> = {
    'text': 'str',
    'number': 'int',
    'select': 'str', // Single select becomes string
    'multi_select': 'list', // Multi select becomes list of strings
    'date': 'date',
    'boolean': 'bool'
  };
  return typeMapping[uiType] || 'str'; // Default to string for unknown types
};

// Convert primitive types from storage to UI types for rendering/editing
export const mapPrimitiveToUiType = (primitiveType: string): string => {
  const mapping: Record<string, string> = {
    'str': 'text',
    'int': 'number',
    'bool': 'boolean',
    'date': 'date',
    'list': 'multi_select',
    // Already UI types (for backward compatibility or mixed data)
    'text': 'text',
    'number': 'number',
    'boolean': 'boolean',
    'select': 'select',
    'multi_select': 'multi_select'
  };
  return mapping[primitiveType] || 'text';
};

/**
 * Create initial Airtable-like structure for a new table
 */
export async function createInitialTableStructure(
  tableId: string,
  actionClient: any
): Promise<void> {
  try {
    console.log('🚀 [TableInitializer] Creating initial structure for table:', tableId);

    // 1. Create default schema with 4 columns (UI types)
    const defaultSchema: TableSchema = {
      columns: [
        { name: 'Column 1', type: 'text', required: false },
        { name: 'Column 2', type: 'text', required: false },
        { name: 'Column 3', type: 'text', required: false },
        { name: 'Column 4', type: 'text', required: false }
      ]
    };

    // 2. Convert UI types to unified primitive types before saving
    const columnsWithPrimitiveTypes = defaultSchema.columns.map(column => ({
      ...column,
      type: mapColumnTypeToPrimitive(column.type)
    }));

    const schemaForDatabase = {
      ...defaultSchema,
      columns: columnsWithPrimitiveTypes
    };

    // 3. Update table with schema in config field
    await actionClient.execute('tables.update', {
      id: tableId,
      config: schemaForDatabase  // ✅ Use 'config' field, not 'schema'
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
    // 1. Create schema (UI types)
    const defaultSchema: TableSchema = {
      columns: [
        { name: 'column1', type: 'text', required: false },
        { name: 'column2', type: 'text', required: false },
      ]
    };

    // 2. Convert UI types to unified primitive types before saving
    const columnsWithPrimitiveTypes = defaultSchema.columns.map(column => ({
      ...column,
      type: mapColumnTypeToPrimitive(column.type)
    }));

    const schemaForDatabase = {
      ...defaultSchema,
      columns: columnsWithPrimitiveTypes
    };

    await updateTableMutation.mutateAsync({
      id: tableId,
      config: schemaForDatabase  // ✅ Use 'config' field, not 'schema'
    });

    console.log('🎉 [TableInitializer] Table initialized successfully!');
    console.log('ℹ️  [TableInitializer] Users can add rows manually when needed');
  };

  return {
    initializeTable,
    isInitializing: updateTableMutation.isPending
  };
}
