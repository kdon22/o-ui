'use client';

import React, { useState } from 'react';
import { useConfirmDialog } from '@/components/ui/hooks/useConfirmDialog';
import { confirm } from '@/components/ui/confirm';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Button
} from '@/components/ui';
import { MoreHorizontal, Copy, Edit3, Trash2 } from 'lucide-react';
import { useActionMutation } from '@/hooks/use-action-api';

interface TableActionsMenuProps {
  table: { id: string; name: string; categoryId?: string };
  onRenamed?: (newName: string) => void;
  onDuplicated?: (newId: string) => void;
  onDeleted?: () => void;
  className?: string;
  useSpanTrigger?: boolean; // true = render a span (for use inside a button row)
}

export const TableActionsMenu: React.FC<TableActionsMenuProps> = ({
  table,
  onRenamed,
  onDuplicated,
  onDeleted,
  className,
  useSpanTrigger = false
}) => {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(table.name);
  
  // Add Stripe-style confirmation
  const { showConfirmDialog, modal } = useConfirmDialog();

  // Action System mutations
  const updateTable = useActionMutation('tables.update');
  const createTable = useActionMutation('tables.create');
  const deleteTable = useActionMutation('tables.delete');

  const handleRename = async () => {
    if (!newName.trim() || newName.trim() === table.name) {
      setRenaming(false);
      return;
    }
    await updateTable.mutateAsync({ id: table.id, name: newName.trim() });
    setRenaming(false);
    onRenamed?.(newName.trim());
  };

  const handleDuplicate = async () => {
    // Duplicate via create with copied fields
    const result = await createTable.mutateAsync({
      name: `${table.name} copy`,
      categoryId: table.categoryId,
      icon: '📊',
      isActive: true,
      clonedFrom: table.id
    } as any);
    if (result?.data?.id) {
      onDuplicated?.(result.data.id);
    }
  };

  const handleDelete = async () => {
    showConfirmDialog(
      async () => {
        await deleteTable.mutateAsync({ id: table.id });
        onDeleted?.();
      },
      confirm.delete(table.name, 'table')
    );
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {useSpanTrigger ? (
          <span
            role="button"
            tabIndex={0}
            className={className || 'inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 ml-1'}
            onClick={(e) => { e.stopPropagation(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpen(true); } }}
            aria-label="Table actions"
          >
            <MoreHorizontal className="w-3 h-3" />
          </span>
        ) : (
          <button
            className={className || 'opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 ml-1'}
            onClick={(e) => { e.stopPropagation(); }}
            aria-label="Table actions"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        {renaming ? (
          <div className="px-2 py-2 space-y-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setRenaming(false);
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleRename}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setRenaming(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <DropdownMenuItem onClick={() => setRenaming(true)} className="gap-2">
              <Edit3 className="w-4 h-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate} className="gap-2">
              <Copy className="w-4 h-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Render confirmation modal */}
      {modal}
    </>
  );
};

export default TableActionsMenu;


