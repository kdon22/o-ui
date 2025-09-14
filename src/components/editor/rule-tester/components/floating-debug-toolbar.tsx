'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Play, 
  StepForward, 
  Square, 
  SkipForward, 
  RotateCcw,
  GripVertical
} from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'
import type { SmartDebugSession, SmartDebugControls } from '@/lib/editor/execution-mapping/types'

interface FloatingDebugToolbarProps {
  smartStepping: SmartDebugSession & SmartDebugControls
  onStart?: () => void
  className?: string
  onClose?: () => void
}

export function FloatingDebugToolbar({ smartStepping, onStart, className, onClose }: FloatingDebugToolbarProps) {
  const [isVisible, setIsVisible] = useState(true) // Always visible for clean system
  const [position, setPosition] = useState({ x: 0, y: 16 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Debug logging for toolbar state
  useEffect(() => {
    console.log('🎛️ [FloatingDebugToolbar] Smart stepping state update:', {
      isRunning: smartStepping.isRunning,
      isPaused: smartStepping.isPaused,
      canStepForward: smartStepping.canStepForward,
      canStepBackward: smartStepping.canStepBackward,
      currentStepIndex: smartStepping.currentStepIndex,
      totalSteps: smartStepping.businessSteps.length
    })
  }, [smartStepping.isRunning, smartStepping.isPaused, smartStepping.canStepForward, smartStepping.canStepBackward, smartStepping.currentStepIndex, smartStepping.businessSteps.length])

  // Show toolbar always when rule tester is open
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Handle drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!toolbarRef.current) return
    
    const rect = toolbarRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragOffset.x - window.innerWidth / 2
    const newY = e.clientY - dragOffset.y
    
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // Don't render if not visible
  if (!isVisible) return null

  return (
    <TooltipProvider>
      <div 
        ref={toolbarRef}
        className={cn(
          "fixed z-50 select-none",
          "bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-lg",
          "transition-shadow duration-200",
          isDragging ? "shadow-xl cursor-grabbing" : "cursor-default",
          className
        )}
        style={{
          left: `calc(50% + ${position.x}px)`,
          top: `${position.y}px`,
          transform: 'translateX(-50%)'
        }}
      >
        <div className="flex items-center gap-0.5 p-1">
          {/* Drag Handle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 cursor-grab hover:bg-muted/50"
                onMouseDown={handleMouseDown}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground font-bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Drag to move toolbar</p>
            </TooltipContent>
          </Tooltip>

          {/* Separator */}
          <div className="w-px h-5 bg-border mx-1" />

          {/* Continue/Start Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('🚀 [FloatingDebugToolbar] Start button clicked')
                  onStart?.()
                }}
                disabled={smartStepping.isRunning}
                className="h-7 w-7 p-0 hover:bg-blue-500/20 disabled:opacity-50"
              >
                <Play className="w-4 h-4 text-blue-600 font-bold fill-current" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{smartStepping.isPaused ? 'Continue (F5)' : 'Start Smart Stepping (F5)'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Step Forward */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('🚀 [FloatingDebugToolbar] Step Forward button clicked')
                  smartStepping.stepForward()
                }}
                disabled={!smartStepping.canStepForward}
                className="h-7 w-7 p-0 hover:bg-blue-500/20 disabled:opacity-50"
              >
                <StepForward className="w-4 h-4 text-blue-600 font-bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Step Forward (F10)</p>
            </TooltipContent>
          </Tooltip>

          {/* Step Backward */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('🚀 [FloatingDebugToolbar] Step Backward button clicked')
                  smartStepping.stepBackward()
                }}
                disabled={!smartStepping.canStepBackward}
                className="h-7 w-7 p-0 hover:bg-blue-500/20 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4 text-blue-600 font-bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Step Backward (Shift+F10)</p>
            </TooltipContent>
          </Tooltip>

          {/* Continue / Run to Breakpoint */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (smartStepping.canContinue) {
                    console.log('🚀 [FloatingDebugToolbar] Continue button clicked')
                    smartStepping.continueExecution()
                  } else {
                    console.log('🚀 [FloatingDebugToolbar] Run to Breakpoint button clicked')
                    smartStepping.runToBreakpoint()
                  }
                }}
                disabled={!smartStepping.canStepForward && !smartStepping.canContinue}
                className="h-7 w-7 p-0 hover:bg-blue-500/20 disabled:opacity-50"
              >
                <SkipForward className="w-4 h-4 text-blue-600 font-bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{smartStepping.canContinue ? 'Continue (F5)' : 'Run to Breakpoint (F8)'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Restart */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStart?.()}
                className="h-7 w-7 p-0 hover:bg-green-500/20"
              >
                <RotateCcw className="w-4 h-4 text-green-600 font-bold" strokeWidth="2.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Restart (Ctrl+Shift+F5)</p>
            </TooltipContent>
          </Tooltip>

          {/* Stop */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('🚀 [FloatingDebugToolbar] Stop button clicked')
                  smartStepping.stop()
                }}
                disabled={!smartStepping.isRunning && !smartStepping.isPaused}
                className="h-7 w-7 p-0 hover:bg-red-500/20 disabled:opacity-50"
              >
                <Square className="w-4 h-4 text-red-600 font-bold fill-current" strokeWidth="2" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stop (Shift+F5)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}