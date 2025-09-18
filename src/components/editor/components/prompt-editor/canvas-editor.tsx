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
  selectedIds: string[]
  isDragging: boolean
  onLayoutChange: (layout: PromptLayout) => void
  onComponentSelect: (component: ComponentItem | null, opts?: { append?: boolean }) => void
  onComponentUpdate: (componentId: string, updates: Partial<ComponentItem>) => void
  onComponentDoubleClick: (component: ComponentItem) => void
}

export function CanvasEditor({
  layout,
  selectedComponent,
  selectedIds,
  isDragging,
  onLayoutChange,
  onComponentSelect,
  onComponentUpdate,
  onComponentDoubleClick
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const isResizingRef = useRef(false)
  const resizeStartRef = useRef<{ x: number, y: number, w: number, h: number } | null>(null)
  const isGroupDraggingRef = useRef(false)
  const groupDragStartRef = useRef<{ startX: number, startY: number, positions: Record<string, { x: number, y: number }> } | null>(null)

  // Generate unique ID for new components
  const generateId = () => `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Default configs for new components
  const getDefaultConfig = (type: string) => {
    const configs = {
      label: { label: 'Label Text', fontSize: 12, textColor: '#374151' },
      'text-input': { placeholder: 'Enter text...', width: 150, height: 32 },
      select: { options: [{ label: 'Option 1', value: 'opt1' }], width: 150 },
      radio: { label: 'Radio Option', labelPosition: 'right' as const, orientation: 'vertical' as const, options: [{ label: 'Option 1', value: 'opt1', isDefault: true }] },
      checkbox: { defaultChecked: false },
      button: { label: 'Button', color: '#3b82f6', backgroundColor: '#3b82f6' },
      divider: { thickness: 1, color: '#e5e7eb', width: 200, style: 'solid' as const }
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
    const append = e.metaKey || e.ctrlKey
    onComponentSelect(component, { append })
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

  // Multi-select drag (custom mouse drag when >1 selected)
  const handleGroupMouseDown = (e: React.MouseEvent, component: ComponentItem) => {
    if (!selectedIds?.includes(component.id) || (selectedIds?.length || 0) < 2) return
    e.preventDefault()

    const positions: Record<string, { x: number, y: number }> = {}
    layout.items.forEach(it => {
      if (selectedIds.includes(it.id)) {
        positions[it.id] = { x: it.x, y: it.y }
      }
    })

    isGroupDraggingRef.current = true
    groupDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      positions
    }

    const onMove = (ev: MouseEvent) => {
      if (!isGroupDraggingRef.current || !groupDragStartRef.current) return
      const dx = ev.clientX - groupDragStartRef.current.startX
      const dy = ev.clientY - groupDragStartRef.current.startY

      const updated = layout.items.map(it => {
        if (!selectedIds.includes(it.id)) return it
        const startPos = groupDragStartRef.current!.positions[it.id]
        const newX = Math.max(0, Math.round(startPos.x + dx))
        const newY = Math.max(0, Math.round(startPos.y + dy))
        return { ...it, x: newX, y: newY }
      })

      onLayoutChange({ ...layout, items: updated })
    }

    const onUp = () => {
      isGroupDraggingRef.current = false
      groupDragStartRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
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
    const isSelected = selectedIds?.includes(component.id)
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
            onMouseDown={(e) => handleGroupMouseDown(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable={!(selectedIds?.length > 1 && selectedIds.includes(component.id))}
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
            onMouseDown={(e) => handleGroupMouseDown(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable={!(selectedIds?.length > 1 && selectedIds.includes(component.id))}
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
            onMouseDown={(e) => handleGroupMouseDown(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable={!(selectedIds?.length > 1 && selectedIds.includes(component.id))}
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
              <option>{config.placeholder || 'Select option...'}</option>
            </select>
          </div>
        )

      case 'radio':
        return (
          <div
            key={component.id}
            style={baseStyle}
            className={`${selectionStyle} px-1.5 py-0.5 rounded`}
            onClick={(e) => handleComponentClick(e, component)}
            onMouseDown={(e) => handleGroupMouseDown(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable={!(selectedIds?.length > 1 && selectedIds.includes(component.id))}
            onDragStart={(e) => handleComponentDragStart(e, component)}
          >
            <div className={`${(config.orientation || 'vertical') === 'vertical' ? 'flex flex-col gap-1.5' : 'flex items-center gap-4'}`}>
              {(config.options || [{ label: 'Option 1', value: 'opt1' }]).map((opt: any, idx: number) => {
                const position = (config.labelPosition || 'right') as 'left' | 'right' | 'top' | 'bottom'
                const isHorizontal = position === 'left' || position === 'right'
                return (
                  <div
                    key={idx}
                    className={`${isHorizontal ? 'flex items-center gap-2' : 'flex flex-col'}`}
                  >
                    {(position === 'left' || position === 'top') && (
                      <span
                        className="text-[12px] text-gray-700"
                        style={{
                          fontSize: config.fontSize ? `${config.fontSize}px` : '12px',
                          color: config.textColor || '#374151',
                          fontWeight: config.fontWeight || 'normal'
                        }}
                      >
                        {opt.label}
                      </span>
                    )}
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
                    {(position === 'right' || position === 'bottom') && (
                      <span
                        className="text-[12px] text-gray-700"
                        style={{
                          fontSize: config.fontSize ? `${config.fontSize}px` : '12px',
                          color: config.textColor || '#374151',
                          fontWeight: config.fontWeight || 'normal'
                        }}
                      >
                        {opt.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'checkbox':
        return (
          <div
            key={component.id}
            style={baseStyle}
            className={`flex items-center gap-1.5 ${selectionStyle} px-1.5 py-0.5 rounded`}
            onClick={(e) => handleComponentClick(e, component)}
            onMouseDown={(e) => handleGroupMouseDown(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable={!(selectedIds?.length > 1 && selectedIds.includes(component.id))}
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
            {/* No label text for checkbox in canvas preview */}
          </div>
        )

      case 'button':
        return (
          <div
            key={component.id}
            style={baseStyle}
            className={`${selectionStyle}`}
            onClick={(e) => handleComponentClick(e, component)}
            onMouseDown={(e) => handleGroupMouseDown(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable={!(selectedIds?.length > 1 && selectedIds.includes(component.id))}
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

      case 'divider':
        return (
          <div
            key={component.id}
            style={baseStyle}
            className={`px-1 ${selectionStyle}`}
            onClick={(e) => handleComponentClick(e, component)}
            onMouseDown={(e) => handleGroupMouseDown(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            draggable={!(selectedIds?.length > 1 && selectedIds.includes(component.id))}
            onDragStart={(e) => handleComponentDragStart(e, component)}
          >
            <div
              className="pointer-events-none"
              style={{
                width: config.width ? `${config.width}px` : '200px',
                borderTop: `${(config as any).thickness || 1}px ${(config as any).style || 'solid'} ${config.color || '#e5e7eb'}`
              }}
            />
          </div>
        )

      default:
        return (
          <div
            key={component.id}
            style={baseStyle}
            className={`px-3 py-2 bg-gray-100 border border-gray-300 rounded ${selectionStyle}`}
            onClick={(e) => handleComponentClick(e, component)}
            onMouseDown={(e) => handleGroupMouseDown(e, component)}
            onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
          >
            {type}
          </div>
        )
    }
  }

  // Use explicit canvas size from layout
  const canvasWidth = layout.canvasWidth || 960
  const canvasHeight = layout.canvasHeight || 615

  // Resize handle interactions
  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRef.current = true
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w: canvasWidth, h: canvasHeight }

    const onMove = (ev: MouseEvent) => {
      if (!isResizingRef.current || !resizeStartRef.current) return
      const dx = ev.clientX - resizeStartRef.current.x
      const dy = ev.clientY - resizeStartRef.current.y
      const newW = Math.max(200, Math.round(resizeStartRef.current.w + dx))
      const newH = Math.max(200, Math.round(resizeStartRef.current.h + dy))
      onLayoutChange({ ...layout, canvasWidth: newW, canvasHeight: newH })
    }

    const onUp = () => {
      isResizingRef.current = false
      resizeStartRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

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
          {/* Canvas size spinners */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
            <span className="text-xs text-gray-500 font-medium">Size:</span>
            <div className="flex items-center gap-1">
              <Label htmlFor="canvas-width" className="text-xs text-gray-500">W</Label>
              <Input
                id="canvas-width"
                type="number"
                inputMode="numeric"
                value={canvasWidth}
                min={200}
                max={1600}
                step={1}
                onChange={(e) => {
                  const val = Math.max(200, Math.min(1600, parseInt(e.target.value || '0') || 0))
                  onLayoutChange({ ...layout, canvasWidth: val })
                }}
                className="h-6 w-20 text-xs px-1 border-gray-300 focus:border-gray-300 focus:ring-0"
                autoComplete="off"
                spellCheck={false}
                showSuccessIndicator={false}
              />
            </div>
            <div className="flex items-center gap-1">
              <Label htmlFor="canvas-height" className="text-xs text-gray-500">H</Label>
              <Input
                id="canvas-height"
                type="number"
                inputMode="numeric"
                value={canvasHeight}
                min={200}
                max={1600}
                step={1}
                onChange={(e) => {
                  const val = Math.max(200, Math.min(1600, parseInt(e.target.value || '0') || 0))
                  onLayoutChange({ ...layout, canvasHeight: val })
                }}
                className="h-6 w-20 text-xs px-1 border-gray-300 focus:border-gray-300 focus:ring-0"
                autoComplete="off"
                spellCheck={false}
                showSuccessIndicator={false}
              />
            </div>
          </div>
          
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
            maxWidth: '100%',
            overflow: 'hidden'
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

          {/* Resize handle */}
          <div
            onMouseDown={onResizeMouseDown}
            className="absolute"
            style={{
              right: '-6px',
              bottom: '-6px',
              width: '14px',
              height: '14px',
              cursor: 'nwse-resize',
              background: 'linear-gradient(135deg, transparent 0 50%, #9ca3af 50% 100%)',
              borderRadius: '2px'
            }}
            aria-label="Resize canvas"
          />
        </div>
      </div>
    </div>
  )
} 