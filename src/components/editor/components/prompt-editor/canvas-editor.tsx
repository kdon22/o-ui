// Canvas Editor - Visual drag-and-drop form builder

'use client'

import { useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PromptLayout, ComponentItem, DragItem } from './types'

interface CanvasEditorProps {
  layout: PromptLayout
  selectedComponent: ComponentItem | null
  isDragging: boolean
  onLayoutChange: (layout: PromptLayout) => void
  onComponentSelect: (component: ComponentItem | null) => void
  onComponentUpdate: (componentId: string, updates: Partial<ComponentItem>) => void
  onComponentDoubleClick: (component: ComponentItem) => void
}

export function CanvasEditor({
  layout,
  selectedComponent,
  isDragging,
  onLayoutChange,
  onComponentSelect,
  onComponentUpdate,
  onComponentDoubleClick
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)

  // Generate unique ID for new components
  const generateId = () => `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Default configs for new components
  const getDefaultConfig = (type: string) => {
    const configs = {
      label: { label: 'Label Text', fontSize: 12, textColor: '#374151' },
      'text-input': { label: 'Text Input', placeholder: 'Enter text...', width: 150, height: 32 },
      select: { label: 'Select Option', options: [{ label: 'Option 1', value: 'opt1' }], width: 150 },
      radio: { label: 'Radio Option', options: [{ label: 'Option 1', value: 'opt1', isDefault: true }] },
      checkbox: { label: 'Checkbox', defaultChecked: false },
      button: { label: 'Button', color: '#3b82f6', backgroundColor: '#3b82f6' }
    }
    return configs[type as keyof typeof configs] || { label: 'Component' }
  }

  // Handle drop from component palette
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    
    if (!canvasRef.current) return

    try {
      // Get drag data and validate it exists
      const dragDataString = e.dataTransfer.getData('application/json')
      if (!dragDataString || dragDataString.trim() === '') {
        console.warn('No drag data found - this may be a component move operation')
        return
      }

      const dragData: DragItem = JSON.parse(dragDataString)
      
      // Validate the parsed data has required fields
      if (!dragData.type || !dragData.label) {
        console.warn('Invalid drag data structure:', dragData)
        return
      }

      const canvasRect = canvasRef.current.getBoundingClientRect()
      
      const x = e.clientX - canvasRect.left
      const y = e.clientY - canvasRect.top

      const newComponent: ComponentItem = {
        id: generateId(),
        type: dragData.type,
        x: Math.max(0, x - 50), // Center on cursor with bounds
        y: Math.max(0, y - 20),
        label: dragData.label,
        config: {
          componentId: generateId(),
          ...getDefaultConfig(dragData.type)
        }
      }

      const updatedLayout: PromptLayout = {
        ...layout,
        items: [...layout.items, newComponent]
      }

      onLayoutChange(updatedLayout)
      // Don't auto-select on drop - let user click to select
    } catch (error) {
      console.error('Failed to parse drag data:', error)
      // Silently fail for invalid drag operations (like moving existing components)
    }
  }, [layout, onLayoutChange])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  // Handle component click/selection
  const handleComponentClick = (e: React.MouseEvent, component: ComponentItem) => {
    e.stopPropagation()
    onComponentSelect(component)
  }

  // Handle component double-click for editing
  const handleComponentDoubleClick = (e: React.MouseEvent, component: ComponentItem) => {
    e.stopPropagation()
    onComponentDoubleClick(component)
  }

  // Handle canvas click to deselect
  const handleCanvasClick = () => {
    onComponentSelect(null)
  }

  // Handle component drag within canvas
  const handleComponentDragStart = (e: React.DragEvent, component: ComponentItem) => {
    e.dataTransfer.setData('component-move', JSON.stringify({
      id: component.id,
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY
    }))
  }

  const handleComponentDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    const moveData = e.dataTransfer.getData('component-move')
    if (!moveData || !canvasRef.current) return

    try {
      const { id, offsetX, offsetY } = JSON.parse(moveData)
      
      // Validate the move data
      if (!id) {
        console.warn('Invalid component move data - missing id')
        return
      }

      const canvasRect = canvasRef.current.getBoundingClientRect()
      
      const newX = e.clientX - canvasRect.left - (offsetX || 0)
      const newY = e.clientY - canvasRect.top - (offsetY || 0)

      onComponentUpdate(id, {
        x: Math.max(0, newX),
        y: Math.max(0, newY)
      })
    } catch (error) {
      console.error('Failed to move component:', error)
    }
  }

  // Render individual component
  const renderComponent = (component: ComponentItem) => {
    const isSelected = selectedComponent?.id === component.id
    const { type, config, x, y } = component

    const baseStyle = {
      position: 'absolute' as const,
      left: `${x}px`,
      top: `${y}px`,
      cursor: 'pointer'
    }

    const selectionStyle = isSelected 
      ? 'ring-2 ring-blue-400 ring-offset-2' 
      : 'hover:ring-1 hover:ring-gray-300'

    switch (type) {
      case 'label':
        return (
          <div
            key={component.id}
            style={baseStyle}
            className={`px-1 py-0.5 rounded ${selectionStyle}`}
            onClick={(e) => handleComponentClick(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable
            onDragStart={(e) => handleComponentDragStart(e, component)}
          >
            <span
              style={{
                color: config.textColor || '#374151',
                fontSize: config.fontSize ? `${config.fontSize}px` : '12px',
                fontWeight: config.fontWeight || 'normal'
              }}
            >
              {config.label || component.label}
            </span>
          </div>
        )

      case 'text-input':
        return (
          <div
            key={component.id}
            style={baseStyle}
            className={`${selectionStyle}`}
            onClick={(e) => handleComponentClick(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable
            onDragStart={(e) => handleComponentDragStart(e, component)}
          >
            <input
              type="text"
              placeholder={config.placeholder || 'Enter text...'}
              disabled
              className="rounded pointer-events-none"
              style={{
                width: config.width ? `${config.width}px` : '150px',
                height: config.height ? `${config.height}px` : '32px',
                fontSize: config.fontSize ? `${config.fontSize}px` : '14px',
                fontWeight: config.fontWeight || 'normal',
                color: config.textColor || '#374151',
                backgroundColor: config.backgroundColor || '#ffffff',
                border: `${config.borderWidth || 1}px ${config.borderStyle || 'solid'} ${config.borderColor || '#d1d5db'}`,
                borderRadius: config.borderRadius ? `${config.borderRadius}px` : '4px',
                padding: '4px 8px'
              }}
            />
          </div>
        )

      case 'select':
        return (
          <div
            key={component.id}
            style={baseStyle}
            className={`${selectionStyle}`}
            onClick={(e) => handleComponentClick(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable
            onDragStart={(e) => handleComponentDragStart(e, component)}
          >
            <select
              disabled
              className="rounded pointer-events-none"
              style={{
                width: config.width ? `${config.width}px` : '150px',
                height: config.height ? `${config.height}px` : '36px',
                fontSize: config.fontSize ? `${config.fontSize}px` : '14px',
                fontWeight: config.fontWeight || 'normal',
                color: config.textColor || '#374151',
                backgroundColor: config.backgroundColor || '#ffffff',
                border: `${config.borderWidth || 1}px ${config.borderStyle || 'solid'} ${config.borderColor || '#d1d5db'}`,
                borderRadius: config.borderRadius ? `${config.borderRadius}px` : '4px',
                padding: '4px 8px'
              }}
            >
              <option>{config.label || 'Select option...'}</option>
            </select>
          </div>
        )

      case 'radio':
        return (
          <div
            key={component.id}
            style={baseStyle}
            className={`flex items-center gap-1.5 ${selectionStyle} px-1.5 py-0.5 rounded`}
            onClick={(e) => handleComponentClick(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable
            onDragStart={(e) => handleComponentDragStart(e, component)}
          >
            <input 
              type="radio" 
              disabled 
              className="pointer-events-none"
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: config.backgroundColor || 'transparent',
                border: `${config.borderWidth || 1}px ${config.borderStyle || 'solid'} ${config.borderColor || '#d1d5db'}`,
                borderRadius: '50%'
              }}
            />
            <span className="text-xs">{config.label || component.label}</span>
          </div>
        )

      case 'checkbox':
        return (
          <div
            key={component.id}
            style={baseStyle}
            className={`flex items-center gap-1.5 ${selectionStyle} px-1.5 py-0.5 rounded`}
            onClick={(e) => handleComponentClick(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable
            onDragStart={(e) => handleComponentDragStart(e, component)}
          >
            <input 
              type="checkbox" 
              disabled 
              className="pointer-events-none"
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: config.backgroundColor || 'transparent',
                border: `${config.borderWidth || 1}px ${config.borderStyle || 'solid'} ${config.borderColor || '#d1d5db'}`,
                borderRadius: config.borderRadius ? `${config.borderRadius}px` : '2px'
              }}
            />
            <span className="text-xs">{config.label || component.label}</span>
          </div>
        )

      case 'button':
        return (
          <div
            key={component.id}
            style={baseStyle}
            className={`${selectionStyle}`}
            onClick={(e) => handleComponentClick(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable
            onDragStart={(e) => handleComponentDragStart(e, component)}
          >
            <button
              disabled
              className="rounded pointer-events-none"
              style={{
                backgroundColor: config.backgroundColor || '#3b82f6',
                color: config.textColor || '#ffffff',
                fontSize: config.fontSize ? `${config.fontSize}px` : '14px',
                fontWeight: config.fontWeight || 'normal',
                border: `${config.borderWidth || 1}px ${config.borderStyle || 'solid'} ${config.borderColor || 'transparent'}`,
                borderRadius: config.borderRadius ? `${config.borderRadius}px` : '6px',
                padding: '6px 12px',
                width: config.width ? `${config.width}px` : 'auto',
                height: config.height ? `${config.height}px` : 'auto'
              }}
            >
              {config.label || component.label}
            </button>
          </div>
        )

      default:
        return (
          <div
            key={component.id}
            style={baseStyle}
            className={`px-3 py-2 bg-gray-100 border border-gray-300 rounded ${selectionStyle}`}
            onClick={(e) => handleComponentClick(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
          >
            {type}
          </div>
        )
    }
  }

  const canvasWidth = layout.canvasWidth || 960
  const canvasHeight = layout.canvasHeight || 615

  return (
    <div className="h-full flex flex-col">
      {/* Canvas Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h3 className="font-medium text-gray-900">Canvas</h3>
          <Badge variant="outline" className="text-xs">
            {canvasWidth} × {canvasHeight}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {layout.items.length} components
          </Badge>
          
          {/* Canvas Position Controls - Only show when component is selected */}
          {selectedComponent && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Canvas Position:</span>
              <div className="flex items-center gap-1">
                <Label htmlFor="canvas-x" className="text-xs text-gray-500">X</Label>
                <Input
                  id="canvas-x"
                  type="number"
                  value={selectedComponent.x}
                  onChange={(e) => onComponentUpdate(selectedComponent.id, { x: parseInt(e.target.value) || 0 })}
                  className="h-6 w-16 text-xs px-1 border-gray-300 focus:border-gray-300 focus:ring-0"
                  autoComplete="off"
                  spellCheck={false}
                  showSuccessIndicator={false}
                />
              </div>
              <div className="flex items-center gap-1">
                <Label htmlFor="canvas-y" className="text-xs text-gray-500">Y</Label>
                <Input
                  id="canvas-y"
                  type="number"
                  value={selectedComponent.y}
                  onChange={(e) => onComponentUpdate(selectedComponent.id, { y: parseInt(e.target.value) || 0 })}
                  className="h-6 w-16 text-xs px-1 border-gray-300 focus:border-gray-300 focus:ring-0"
                  autoComplete="off"
                  spellCheck={false}
                  showSuccessIndicator={false}
                />
              </div>
            </div>
          )}
        </div>
        
        {selectedComponent && (
          <Badge variant="default" className="text-xs">
            Selected: {selectedComponent.type}
          </Badge>
        )}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-4">
        <div
          ref={canvasRef}
          className={`
            relative bg-white border-2 border-dashed border-gray-300 rounded-lg
            ${isDragging ? 'border-blue-400 bg-blue-50' : ''}
          `}
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            minWidth: '100%',
            minHeight: '400px'
          }}
          onDrop={(e) => {
            // Handle component moving first (higher priority)
            if (e.dataTransfer.getData('component-move')) {
              handleComponentDrop(e)
            } else {
              // Handle new component creation from palette
              handleDrop(e)
            }
          }}
          onDragOver={handleDragOver}
          onClick={handleCanvasClick}
        >
          {layout.items.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">🎨</div>
                <p className="text-sm">Drag components here to start building</p>
              </div>
            </div>
          ) : (
            layout.items.map(renderComponent)
          )}
        </div>
      </div>
    </div>
  )
} 