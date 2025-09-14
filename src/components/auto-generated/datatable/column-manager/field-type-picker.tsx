"use client";

import React, { useMemo, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Input,
  Separator,
  Button
} from '@/components/ui';
import { Type, Hash, Calendar, ToggleLeft, List, Search } from 'lucide-react';

type FieldType = 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'boolean';

interface FieldTypePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: FieldType) => void;
  children: React.ReactNode; // usually the "+ Add field" button
}

const FIELD_TYPES: Array<{ value: FieldType; label: string; icon: any }> = [
  { value: 'text', label: 'Single line text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'select', label: 'Single select', icon: List },
  { value: 'multi_select', label: 'Multiple select', icon: List },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'boolean', label: 'Checkbox', icon: ToggleLeft }
];

export const FieldTypePicker: React.FC<FieldTypePickerProps> = ({
  open,
  onOpenChange,
  onSelect,
  children
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FIELD_TYPES;
    return FIELD_TYPES.filter(t => t.label.toLowerCase().includes(q) || t.value.includes(q));
  }, [query]);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-[360px] p-0">
        <div className="p-2 border-b">
          <div className="relative">
            <Input
              placeholder="Find a field type"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>
        <div className="p-2">
          <div className="px-2 pb-2 text-xs font-medium text-gray-500">Standard fields</div>
          <div className="flex flex-col gap-1">
            {filtered.map((t) => {
              const Icon = t.icon;
              return (
                <Button
                  key={t.value}
                  variant="ghost"
                  className="justify-start h-9"
                  onClick={() => {
                    onSelect(t.value);
                    onOpenChange(false);
                  }}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {t.label}
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FieldTypePicker;


