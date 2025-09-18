// Properties Modal - Slide-out modal for component configuration (matches old system)

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { BasicPropertiesSection, StylingSection, OptionsSection } from './components'
import type { ComponentItem } from './types'

interface PropertiesModalProps {
  selectedComponent: ComponentItem | null
  isOpen: boolean
  onClose: () => void
  onComponentUpdate: (componentId: string, updates: Partial<ComponentItem>) => void
}

export function PropertiesModal({ 
  selectedComponent, 
  isOpen, 
  onClose, 
  onComponentUpdate 
}: PropertiesModalProps) {
  const [localConfig, setLocalConfig] = useState(selectedComponent?.config || {})

  // Update local state when selection changes
  useEffect(() => {
    setLocalConfig(selectedComponent?.config || {})
  }, [selectedComponent])

  // Close on ESC only (and header X button). Disable backdrop-to-close.
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  // Handle immediate updates for instant feedback
  const handleConfigChange = (key: string, value: any) => {
    if (!selectedComponent) return

    const newConfig = { ...localConfig, [key]: value }
    setLocalConfig(newConfig)

    // Immediate update for instant feedback
    onComponentUpdate(selectedComponent.id, {
      config: newConfig
    })
  }

  if (!selectedComponent) return null

  const { type } = selectedComponent

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        />
      )}

      {/* Sliding Panel */}
      <div 
        className={`fixed top-0 right-0 h-screen w-80 bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ height: '100vh' }}
      >
        {/* Header - Fixed Height */}
        <div className="h-20 border-b border-gray-100 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Component Properties</h2>
              <Badge variant="outline" className="text-xs">
                {type}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Changes apply instantly to the canvas
          </p>
        </div>

        {/* Properties Form - Calculated Height Scrollable Area */}
        <div 
          className="overflow-y-auto overflow-x-hidden"
          style={{ 
            height: 'calc(100vh - 80px)',
            maxHeight: 'calc(100vh - 80px)'
          }}
        >
          <div className="p-4 space-y-6">
            <BasicPropertiesSection
              type={type}
              config={localConfig}
              onConfigChange={handleConfigChange}
            />

            <StylingSection
              type={type}
              config={localConfig}
              onConfigChange={handleConfigChange}
            />

            <OptionsSection
              type={type}
              config={localConfig}
              onConfigChange={handleConfigChange}
            />
            
            {/* Extra bottom spacing to ensure last content is reachable */}
            <div className="h-8"></div>
          </div>
        </div>
      </div>
    </>
  )
} 