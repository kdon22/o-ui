// Component Palette - Draggable form components

'use client'

import { useState } from 'react'
import { Type, CheckSquare, Circle, List, Square, MousePointer, Minus, Table } from 'lucide-react'
import type { ComponentType, DragItem } from './types'

interface ComponentPaletteProps {
  onDragStart: (dragging: boolean) => void
  onDragEnd: () => void
}

const COMPONENT_ITEMS: Array<{
  type: ComponentType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}> = [
  {
    type: 'label',
    label: 'Label',
    icon: Type,
    description: 'Static text label'
  },
  {
    type: 'text-input',
    label: 'Text Input',
    icon: Square,
    description: 'Single line text input'
  },
  {
    type: 'select',
    label: 'Select',
    icon: List,
    description: 'Dropdown selection'
  },
  {
    type: 'radio',
    label: 'Radio',
    icon: Circle,
    description: 'Radio button group'
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: CheckSquare,
    description: 'Checkbox input'
  },
  {
    type: 'button',
    label: 'Button',
    icon: MousePointer,
    description: 'Action button'
  }
  ,
  {
    type: 'divider',
    label: 'Divider',
    icon: Minus,
    description: 'Horizontal divider line'
  }
  ,
  {
    type: 'table',
    label: 'Table',
    icon: Table,
    description: 'Tabular data with selectable rows'
  }
]

export function ComponentPalette({ onDragStart, onDragEnd }: ComponentPaletteProps) {
  const [draggedItem, setDraggedItem] = useState<ComponentType | null>(null)

  const handleDragStart = (e: React.DragEvent, type: ComponentType, label: string) => {
    const dragData: DragItem = { type, label }
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'copy'
    
    setDraggedItem(type)
    onDragStart(true)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    onDragEnd()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-100">
        <h4 className="font-medium text-sm text-gray-900">Components</h4>
        <p className="text-xs text-gray-500 mt-1">
          Drag components onto the canvas
        </p>
      </div>

      {/* Component Grid */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="grid grid-cols-2 gap-1.5">
          {COMPONENT_ITEMS.map((item) => {
            const Icon = item.icon
            const isDragging = draggedItem === item.type

            return (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => handleDragStart(e, item.type, item.label)}
                onDragEnd={handleDragEnd}
                className={`
                  group p-2 rounded-lg border-2 border-dashed border-gray-300 
                  cursor-move transition-all hover:border-blue-300 hover:bg-blue-50
                  ${isDragging ? 'opacity-50 border-blue-400 bg-blue-100' : ''}
                `}
                title={item.description}
              >
                <div className="flex flex-col items-center text-center">
                  <Icon className={`
                    h-4 w-4 mb-1 text-gray-600 group-hover:text-blue-600 transition-colors
                    ${isDragging ? 'text-blue-600' : ''}
                  `} />
                  <span className={`
                    text-[10px] font-medium text-gray-700 group-hover:text-blue-700 leading-tight
                    ${isDragging ? 'text-blue-700' : ''}
                  `}>
                    {item.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Usage Hint */}
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            💡 <strong>Tip:</strong> Drag components onto the canvas, then double-click to edit properties
          </p>
        </div>
      </div>
    </div>
  )
} 