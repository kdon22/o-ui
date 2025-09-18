### API (Props & Types)

AutoTable props (`components/auto-generated/table/types.ts`):

```ts
interface AutoTableProps {
  resourceKey: string;
  filters?: Record<string, any>;
  onRowClick?: (entity: any) => void;
  className?: string;
  level1Filter?: string;
  level2Filter?: string;
  onLevel1FilterChange?: (value: string) => void;
  onLevel2FilterChange?: (value: string) => void;
  filteringConfig?: FilteringConfig;
  headerActions?: React.ReactNode | ((handleAdd: () => void) => React.ReactNode);
  enhancedData?: any[];
  processTypes?: Array<{ id: string; name: string; count: number }>;
  processNames?: Array<{ id: string; name: string; count: number; type: string }>;
  customTitle?: string;
  customSearchPlaceholder?: string;
  navigationContext?: { nodeId?: string | null; parentId?: string | null; branchId?: string | null; tenantId?: string | null; userId?: string | null; [key: string]: any };
}
```

Key types:
- `TableColumn { key, header, width, sortable, filterable, render(entity) }`
- `SortConfig { field, direction }`
- `InlineFormProps { resource, entity?, onSubmit, onCancel, mode, parentData?, navigationContext? }`
- `FloatingBulkActionsProps { resource, selectedCount, onAction, isVisible }`

Hooks:
- `useTableMutations({ resourceKey, onSuccess?, nodeId?, onBatchChange? })`
- `useTableData({ data, resource, searchTerm, columnFilters, sortConfig, level1Filter, level2Filter, filteringConfig })`
- `useTableActions({ resource, resourceKey, formRef, mutations, junctionRelationships, formState, tableState, processedEntities, navigationContext, customHandlers })`
- `useTableState({ resource })`
- `useChangeHistory({ resourceKey, tenantId, branchId })`


