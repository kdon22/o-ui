# AutoDataTable - Airtable-like Dynamic Tables

## Quick Usage

```tsx
import { AutoDataTable } from '@/components/auto-generated/datatable';

function TablePage({ tableId }: { tableId: string }) {
  return (
    <AutoDataTable 
      tableId={tableId}
      onCellEdit={(rowId, column, value) => {
        console.log('Cell edited:', { rowId, column, value });
      }}
      onRowAdd={() => {
        console.log('Row added');
      }}
    />
  );
}
```

## Features

✅ **Dynamic Columns**: Auto-generated from table schema JSON  
✅ **Inline Editing**: Click any cell to edit (Airtable UX)  
✅ **Branch Overlay**: Shows main branch data + current branch changes  
✅ **Copy-on-Write**: Editing inherited rows creates branch copies automatically  
✅ **Type-Aware Inputs**: Different editors for text, number, select, date, boolean  
✅ **Visual Inheritance**: Inherited rows are dimmed with "from main" badge  
✅ **Sorting**: Click column headers to sort  
✅ **Mobile-First**: Responsive design  

## Data Flow

1. **Table Schema**: Stored in `DataTable.config.schema` (JSON)
2. **Row Data**: Stored in `TableData.data` (JSON) 
3. **Branch Overlay**: Shows current branch + inherited from main
4. **Copy-on-Write**: Automatic when editing inherited rows

## Next Steps

1. Run Prisma migration: `npx prisma migrate dev --name add-table-data`
2. Use in your table pages: `<AutoDataTable tableId="your-table-id" />`
3. The component handles all branching, overlay, and CoW automatically!
