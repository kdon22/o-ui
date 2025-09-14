/**
 * NumberInput Component
 * 
 * Re-engineered from scratch for bulletproof number display with spinners.
 * Ensures the number is always visible with proper spacing.
 */

import React, { useCallback, useRef, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'

export interface NumberInputProps {
  /**
   * Current numeric value
   */
  value: number
  
  /**
   * Callback when value changes
   */
  onChange: (value: number) => void
  
  /**
   * Minimum allowed value
   */
  min?: number
  
  /**
   * Maximum allowed value  
   */
  max?: number
  
  /**
   * Step increment/decrement amount
   */
  step?: number
  
  /**
   * Whether to show the spinner buttons
   */
  showSpinner?: boolean

  /**
   * CSS class name
   */
  className?: string

  /**
   * Whether the input is disabled
   */
  disabled?: boolean

  /**
   * Placeholder text
   */
  placeholder?: string

  /**
   * Unit label to display (e.g., "px", "em", "%")
   */
  unit?: string
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ 
    value, 
    onChange, 
    min = -Infinity, 
    max = Infinity, 
    step = 1,
    showSpinner = true,
    className,
    disabled = false,
    placeholder,
    unit,
    ...props 
  }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isFocused, setIsFocused] = useState(false)
    
    // Clamp value within bounds
    const clampValue = useCallback((val: number) => {
      if (val < min) return min
      if (val > max) return max
      return val
    }, [min, max])
    
    // Handle input change with better validation
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.trim()
      
      console.log('Input changed to:', inputValue) // Debug log
      
      // Handle empty input
      if (inputValue === '' || inputValue === '-') {
        return // Allow temporary empty state during typing
      }
      
      const numValue = parseFloat(inputValue)
      console.log('Parsed number:', numValue) // Debug log
      
      if (!isNaN(numValue) && isFinite(numValue)) {
        const clampedValue = clampValue(numValue)
        console.log('Clamped value:', clampedValue) // Debug log
        console.log('Min:', min, 'Max:', max) // Debug log
        onChange(clampedValue)
      }
    }, [onChange, clampValue, min, max])
    
    // Handle blur to ensure valid value
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      const inputValue = e.target.value.trim()
      
      if (inputValue === '' || inputValue === '-') {
        onChange(min >= 0 ? min : 0) // Default to sensible value
      }
    }, [onChange, min])
    
    // Handle focus
    const handleFocus = useCallback(() => {
      setIsFocused(true)
    }, [])
    
    // Handle increment
    const handleIncrement = useCallback(() => {
      const newValue = clampValue(value + step)
      onChange(newValue)
      // Keep focus on input
      setTimeout(() => inputRef.current?.focus(), 0)
    }, [value, step, clampValue, onChange])
    
    // Handle decrement  
    const handleDecrement = useCallback(() => {
      const newValue = clampValue(value - step)
      onChange(newValue)
      // Keep focus on input
      setTimeout(() => inputRef.current?.focus(), 0)
    }, [value, step, clampValue, onChange])
    
    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        handleIncrement()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        handleDecrement()
      }
    }, [handleIncrement, handleDecrement])
    
    // Check if buttons should be disabled
    const canDecrement = !disabled && value > min
    const canIncrement = !disabled && value < max
    
    // Display value (always show current value, never hide it)
    const displayValue = isFinite(value) ? value.toString() : ''
    
    // Debug: Log the current value prop
    console.log('NumberInput received value prop:', value)

    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Compact input + spinner wrapper */}
        <div className="flex items-stretch">
          {/* Input field - more compact */}
          <input
            ref={ref || inputRef}
            type="text" // Use text to have full control over display
            inputMode="numeric" // Mobile numeric keypad
            value={displayValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              // Compact base styling
              "h-8 w-16 rounded-l-md border border-r-0 border-input bg-background text-sm",
              "px-2 py-1 text-foreground text-center",
              // Focus states
              "focus:outline-none focus:ring-1 focus:ring-ring",
              "focus:border-transparent focus:z-10",
              // Disabled state
              "disabled:cursor-not-allowed disabled:opacity-50",
              // Round both sides if no spinner
              !showSpinner && "rounded-r-md border-r w-20"
            )}
            {...props}
          />
          
          {/* Compact spinner buttons */}
          {showSpinner && (
            <div className="flex flex-col h-8 border border-l-0 border-input rounded-r-md bg-background">
              {/* Increment button */}
              <button
                type="button"
                disabled={!canIncrement}
                onClick={handleIncrement}
                className={cn(
                  "flex flex-1 w-5 items-center justify-center rounded-tr-md",
                  "hover:bg-muted transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-30",
                  "border-b border-border/30"
                )}
                tabIndex={-1}
                aria-label="Increment"
              >
                <ChevronUp className="h-2.5 w-2.5 text-muted-foreground" />
              </button>
              
              {/* Decrement button */}
              <button
                type="button"
                disabled={!canDecrement}
                onClick={handleDecrement}
                className={cn(
                  "flex flex-1 w-5 items-center justify-center rounded-br-md",
                  "hover:bg-muted transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-30"
                )}
                tabIndex={-1}
                aria-label="Decrement"
              >
                <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
        
        {/* Unit label - completely separate */}
        {unit && (
          <span className="text-sm text-muted-foreground font-medium select-none">
            {unit}
          </span>
        )}
      </div>
    )
  }
)

NumberInput.displayName = "NumberInput"